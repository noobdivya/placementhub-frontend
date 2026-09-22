"use client";

import Link from "next/link";
import { useState } from "react";
import AuthCard from "@/components/AuthCard";
import { Notice } from "@/components/ui";
import { ApiError, errorMessage, registerCompany, type CompanyRegistration } from "@/lib/api";

const empty: CompanyRegistration = { companyName: "", industry: "", hrName: "", email: "", phone: "", password: "" };

const inputs: { k: keyof CompanyRegistration; label: string; type?: string; required?: boolean; auto?: string }[] = [
  { k: "companyName", label: "Company name" },
  { k: "industry", label: "Industry", required: false },
  { k: "hrName", label: "HR contact name", auto: "name" },
  { k: "email", label: "Work email", type: "email", auto: "email" },
  { k: "phone", label: "Phone", type: "tel", required: false, auto: "tel" },
  { k: "password", label: "Password (min. 8 characters)", type: "password", auto: "new-password" },
];

export default function RegisterPage() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);

  if (done)
    return (
      <AuthCard
        title="Registration received"
        footer={
          <Link href="/login" className="font-medium text-indigo-600 dark:text-indigo-300">
            Go to sign in
          </Link>
        }
      >
        <Notice tone="success">{done}</Notice>
      </AuthCard>
    );

  return (
    <AuthCard
      title="Register your company"
      subtitle="The placement cell approves new recruiters. You can draft jobs while you wait."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-indigo-600 dark:text-indigo-300">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setFields({});
          try {
            const r = await registerCompany(form);
            setDone(r.message);
          } catch (err) {
            if (err instanceof ApiError && err.fields) setFields(err.fields);
            setError(err instanceof ApiError && err.fields ? err.message : errorMessage(err));
            setBusy(false);
          }
        }}
      >
        {inputs.map(({ k, label, type = "text", required = true, auto }) => (
          <div key={k}>
            <label className="label" htmlFor={k}>
              {label}
            </label>
            <input id={k} className="input" type={type} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} required={required} autoComplete={auto} />
            {fields[k] && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fields[k]}</p>}
          </div>
        ))}
        {error && <Notice tone="error">{error}</Notice>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Registering…" : "Register"}
        </button>
      </form>
    </AuthCard>
  );
}
