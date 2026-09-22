"use client";

import { useRef, useState } from "react";
import { Icon } from "./icons";
import Modal from "./Modal";
import { Avatar, Badge, EmptyState, ErrorState, Notice, Spinner, TableWrap, type Tone } from "./ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { BRANCHES, type Page, type Student } from "@/lib/data";
import { useDebounced, useFetch } from "@/lib/hooks";

const statusTone: Record<Student["status"], Tone> = { Placed: "emerald", "In process": "amber", Unplaced: "slate" };
const PAGE_SIZE = 25;

interface NewStudentForm {
  name: string;
  roll: string;
  email: string;
  branch: string;
  year: string;
  cgpa: string;
  backlogs: string;
  phone: string;
}
const blank: NewStudentForm = { name: "", roll: "", email: "", branch: "CSE", year: "Final year", cgpa: "", backlogs: "0", phone: "" };

/** A one-time temporary password, shown once so the cell can pass it on. */
function TempPassword({ title, who, password, onClose }: { title: string; who: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Share this temporary password with <strong>{who}</strong>. It is shown only once, and they must change it at first sign-in.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <code className="flex-1 select-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-800">{password}</code>
        <button
          className="btn-outline"
          onClick={() => {
            void navigator.clipboard?.writeText(password).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

function AddStudent({ onClose, onCreated }: { onClose: () => void; onCreated: (r: { name: string; tempPassword: string }) => void }) {
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const set = (k: keyof NewStudentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const err = (k: string) => fields[k] && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fields[k]}</p>;

  return (
    <Modal title="Add a student" onClose={onClose} wide>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setFields({});
          try {
            const r = await api.post<{ name: string; tempPassword: string }>("/admin/students", { ...f, cgpa: Number(f.cgpa), backlogs: Number(f.backlogs) });
            onCreated(r);
          } catch (e2) {
            if (e2 instanceof ApiError && e2.fields) setFields(e2.fields);
            setError(errorMessage(e2));
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-name">Full name</label>
            <input id="s-name" className="input" value={f.name} onChange={set("name")} required />
            {err("name")}
          </div>
          <div>
            <label className="label" htmlFor="s-roll">Roll number</label>
            <input id="s-roll" className="input" value={f.roll} onChange={set("roll")} required />
            {err("roll")}
          </div>
          <div>
            <label className="label" htmlFor="s-email">College email</label>
            <input id="s-email" className="input" type="email" value={f.email} onChange={set("email")} required />
            {err("email")}
          </div>
          <div>
            <label className="label" htmlFor="s-phone">Phone (optional)</label>
            <input id="s-phone" className="input" type="tel" value={f.phone} onChange={set("phone")} />
            {err("phone")}
          </div>
          <div>
            <label className="label" htmlFor="s-branch">Branch</label>
            <select id="s-branch" className="input" value={f.branch} onChange={set("branch")}>
              {BRANCHES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            {err("branch")}
          </div>
          <div>
            <label className="label" htmlFor="s-year">Year</label>
            <input id="s-year" className="input" value={f.year} onChange={set("year")} required />
            {err("year")}
          </div>
          <div>
            <label className="label" htmlFor="s-cgpa">CGPA</label>
            <input id="s-cgpa" className="input" type="number" min="0" max="10" step="0.01" value={f.cgpa} onChange={set("cgpa")} required />
            {err("cgpa")}
          </div>
          <div>
            <label className="label" htmlFor="s-back">Active backlogs</label>
            <input id="s-back" className="input" type="number" min="0" value={f.backlogs} onChange={set("backlogs")} required />
            {err("backlogs")}
          </div>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create student"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface ImportResult {
  created: { name: string; email: string; tempPassword: string }[];
  errors: { row: number; message: string }[];
}

function ImportResultDialog({ result, onClose }: { result: ImportResult; onClose: () => void }) {
  const csv = () => {
    const rows = [["name", "email", "tempPassword"], ...result.created.map((c) => [c.name, c.email, c.tempPassword])];
    const blob = new Blob([rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "new-student-passwords.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };
  return (
    <Modal title="Import finished" onClose={onClose} wide>
      <p className="text-sm">
        <strong>{result.created.length}</strong> student(s) created, <strong>{result.errors.length}</strong> row(s) skipped.
      </p>
      {result.created.length > 0 && (
        <div className="mt-3">
          <Notice tone="success">Temporary passwords are shown only now. Download them and pass them on; students must change them at first sign-in.</Notice>
          <button className="btn-outline mt-3" onClick={csv}>
            <Icon name="download" className="size-4" /> Download passwords (CSV)
          </button>
        </div>
      )}
      {result.errors.length > 0 && (
        <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto text-sm text-rose-600 dark:text-rose-400">
          {result.errors.map((e) => (
            <li key={e.row}>
              Row {e.row}: {e.message}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

export default function StudentsTable() {
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [temp, setTemp] = useState<{ title: string; who: string; password: string } | null>(null);
  const [imported, setImported] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const q = useDebounced(query.trim());
  const students = useFetch<Page<Student>>("/admin/students", { q, branch: branch === "All" ? undefined : branch, status: status === "All" ? undefined : status, page, limit: PAGE_SIZE });

  const guard = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const rows = students.data?.items ?? [];
  const total = students.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="relative min-w-52 flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-9" placeholder="Search name, roll no. or email" value={query} onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }} aria-label="Search students" />
        </div>
        <select className="input !w-auto" value={branch} onChange={(e) => {
            setBranch(e.target.value);
            setPage(1);
          }} aria-label="Branch">
          <option value="All">All branches</option>
          {BRANCHES.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select className="input !w-auto" value={status} onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }} aria-label="Status">
          <option value="All">All statuses</option>
          <option>Placed</option>
          <option>In process</option>
          <option>Unplaced</option>
        </select>
        <button className="btn-outline" onClick={() => api.download("/admin/students/export.csv", "students.csv", { q, branch: branch === "All" ? undefined : branch, status: status === "All" ? undefined : status }).catch((e) => setError(errorMessage(e)))}>
          <Icon name="download" className="size-4" /> Export
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            void guard("import", async () => {
              const fd = new FormData();
              fd.append("file", f);
              setImported(await api.upload<ImportResult>("/admin/students/import", fd));
              students.reload();
            });
          }}
        />
        <button className="btn-outline" onClick={() => fileInput.current?.click()} disabled={busy === "import"} title="Columns: name, roll, email, branch, cgpa (optional: year, backlogs, phone)">
          <Icon name="upload" className="size-4" /> {busy === "import" ? "Importing…" : "Import CSV"}
        </button>
        <button className="btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" className="size-4" /> Add student
        </button>
      </div>

      {error && (
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {students.error ? (
        <ErrorState message={students.error} onRetry={students.reload} />
      ) : students.loading && !students.data ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No students found" hint="Adjust your filters or search term, or add students." />
      ) : (
        <TableWrap>
          <table className={`w-full ${students.loading ? "opacity-60" : ""}`}>
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="th">Student</th>
                <th className="th">Roll no.</th>
                <th className="th">Branch</th>
                <th className="th">CGPA</th>
                <th className="th">Status</th>
                <th className="th">Company</th>
                <th className="th">CTC</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.name} className="size-8" />
                      <div>
                        <p className="font-medium">
                          {s.name} {!s.active && <Badge tone="rose">Deactivated</Badge>}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">{s.roll}</td>
                  <td className="td">{s.branch}</td>
                  <td className="td">{s.cgpa}</td>
                  <td className="td">
                    <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                  </td>
                  <td className="td">{s.company ?? "—"}</td>
                  <td className="td">{s.ctc ? `${s.ctc} LPA` : "—"}</td>
                  <td className="td">
                    <div className="flex justify-end gap-3 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-indigo-600 disabled:opacity-50 dark:text-indigo-300"
                        disabled={busy === s.id}
                        onClick={() =>
                          window.confirm(`Issue ${s.name} a new temporary password? Their current password stops working and they are signed out everywhere.`) &&
                          guard(s.id, async () => {
                            const r = await api.post<{ tempPassword: string }>(`/admin/students/${s.id}/reset-password`);
                            setTemp({ title: "Password reset", who: s.name, password: r.tempPassword });
                          })
                        }
                      >
                        Reset password
                      </button>
                      <button
                        className={`disabled:opacity-50 ${s.active ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                        disabled={busy === s.id}
                        onClick={() =>
                          guard(s.id, async () => {
                            await api.post(`/admin/students/${s.id}/${s.active ? "deactivate" : "activate"}`);
                            students.reload();
                          })
                        }
                      >
                        {s.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>
          Showing {rows.length} of {total} students
        </span>
        {pages > 1 && (
          <span className="flex items-center gap-2">
            <button className="btn-outline !px-2.5 !py-1 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            Page {page} of {pages}
            <button className="btn-outline !px-2.5 !py-1 text-xs" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </span>
        )}
      </div>

      {adding && (
        <AddStudent
          onClose={() => setAdding(false)}
          onCreated={(r) => {
            setAdding(false);
            setTemp({ title: "Student created", who: r.name, password: r.tempPassword });
            students.reload();
          }}
        />
      )}
      {temp && <TempPassword {...temp} onClose={() => setTemp(null)} />}
      {imported && <ImportResultDialog result={imported} onClose={() => setImported(null)} />}
    </div>
  );
}
