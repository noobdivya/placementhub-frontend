"use client";

import { useState } from "react";
import Modal from "./Modal";
import ReasonDialog from "./ReasonDialog";
import { Badge, CompanyLogo, ErrorState, Notice, Spinner, StatCard, TableWrap, type Tone } from "./ui";
import { api, errorMessage } from "@/lib/api";
import { formatDate, type CompanyRecord } from "@/lib/data";
import { useFetch } from "@/lib/hooks";

const tone: Record<CompanyRecord["status"], Tone> = { Approved: "emerald", Pending: "amber", Rejected: "rose" };

export default function CompanyApprovals() {
  const companies = useFetch<{ items: CompanyRecord[] }>("/admin/companies");
  const [tab, setTab] = useState<"All" | CompanyRecord["status"]>("All");
  const [rejecting, setRejecting] = useState<CompanyRecord | null>(null);
  const [temp, setTemp] = useState<{ name: string; password: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (companies.error) return <ErrorState message={companies.error} onRetry={companies.reload} />;
  if (!companies.data) return <Spinner />;

  const rows = companies.data.items;
  const count = (s: CompanyRecord["status"]) => rows.filter((c) => c.status === s).length;
  const shown = rows.filter((c) => tab === "All" || c.status === tab);
  const tabs = ["All", "Approved", "Pending", "Rejected"] as const;

  const setStatus = async (c: CompanyRecord, status: CompanyRecord["status"], reason = "") => {
    const updated = await api.patch<CompanyRecord>(`/admin/companies/${c.id}/status`, { status, reason });
    companies.setData((p) => (p ? { items: p.items.map((x) => (x.id === c.id ? { ...x, ...updated } : x)) } : p));
  };

  const approve = async (c: CompanyRecord) => {
    setBusy(c.id);
    setError(null);
    try {
      await setStatus(c, "Approved");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const resetPassword = async (c: CompanyRecord) => {
    if (!window.confirm(`Issue ${c.name} a new temporary password? Their current password stops working.`)) return;
    setBusy(c.id);
    setError(null);
    try {
      const r = await api.post<{ tempPassword: string }>(`/admin/companies/${c.id}/reset-password`);
      setTemp({ name: c.name, password: r.tempPassword });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Approved partners" value={count("Approved")} icon="check" tone="emerald" />
        <StatCard label="Awaiting approval" value={count("Pending")} icon="clock" tone="amber" />
        <StatCard label="Rejected" value={count("Rejected")} icon="x" tone="rose" />
      </div>

      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <div className="card">
        <div className="flex gap-1 border-b border-slate-100 p-2 dark:border-slate-800" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${
                tab === t ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <TableWrap>
          <table className="w-full">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="th">Company</th>
                <th className="th">HR contact</th>
                <th className="th">Open roles</th>
                <th className="th">Past hires</th>
                <th className="th">Last visit</th>
                <th className="th">Status</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shown.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <CompanyLogo name={c.name} color={c.color} size="size-9" />
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{c.industry}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <p>{c.hr}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.email}</p>
                  </td>
                  <td className="td">{c.openRoles}</td>
                  <td className="td">{c.hires}</td>
                  <td className="td whitespace-nowrap">{formatDate(c.lastVisit)}</td>
                  <td className="td">
                    <Badge tone={tone[c.status]}>{c.status}</Badge>
                    {c.status === "Rejected" && c.statusReason && <p className="mt-1 max-w-48 text-xs text-slate-500 dark:text-slate-400">{c.statusReason}</p>}
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-ghost !px-2 !py-1.5 text-xs" onClick={() => resetPassword(c)} disabled={busy === c.id}>
                        Reset password
                      </button>
                      {c.status !== "Approved" && (
                        <button className="btn-primary !px-3 !py-1.5" onClick={() => approve(c)} disabled={busy === c.id}>
                          Approve
                        </button>
                      )}
                      {c.status === "Pending" && (
                        <button className="btn-outline !px-3 !py-1.5 text-rose-600 dark:text-rose-400" onClick={() => setRejecting(c)} disabled={busy === c.id}>
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-slate-500" colSpan={7}>
                    No companies here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </div>

      {rejecting && (
        <ReasonDialog
          title={`Reject ${rejecting.name}`}
          hint="Their live jobs will be closed. They'll see this reason on their dashboard."
          confirmLabel="Reject company"
          onConfirm={(reason) => setStatus(rejecting, "Rejected", reason)}
          onClose={() => setRejecting(null)}
        />
      )}

      {temp && (
        <Modal title="Password reset" onClose={() => setTemp(null)}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Share this temporary password with <strong>{temp.name}</strong>. It is shown only once, and they must change it at next sign-in.
          </p>
          <code className="mt-4 block select-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm dark:bg-slate-800">{temp.password}</code>
          <div className="mt-6 flex justify-end">
            <button className="btn-primary" onClick={() => setTemp(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
