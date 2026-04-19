"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

const DEMO = {
  customer: { email: "user1@cleverlocale.local", password: "cl@123", label: "Customer / User" },
  vendor: { email: "vendor1@cleverlocale.local", password: "cl@123", label: "Vendor" },
  admin: { email: "admin1@cleverlocale.local", password: "cl@123", label: "Admin" },
} as const;

type LoginKind = "" | keyof typeof DEMO;

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loginKind, setLoginKind] = useState<LoginKind>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loginKind) {
      return;
    }
    const row = DEMO[loginKind];
    setEmail(row.email);
    setPassword(row.password);
  }, [loginKind]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl || "/",
    });

    setPending(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    window.location.href = res?.url || callbackUrl || "/";
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border-2 border-emerald-600 bg-white p-6 shadow-xl shadow-emerald-900/10 ring-4 ring-emerald-500/15 dark:border-emerald-500 dark:bg-zinc-950 dark:ring-emerald-400/20"
      aria-labelledby="login-panel-title"
    >
      <h2 id="login-panel-title" className="sr-only">
        Sign in to Cleverlocale
      </h2>
      <div className="flex flex-col gap-2">
        <label htmlFor="login-as" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Sign in as
        </label>
        <select
          id="login-as"
          name="loginAs"
          value={loginKind}
          onChange={(e) => setLoginKind(e.target.value as LoginKind)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-0 focus:outline-none focus:ring-0 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="">Choose…</option>
          <option value="customer">Login as Customer / User</option>
          <option value="vendor">Login as Vendor</option>
          <option value="admin">Login as Admin</option>
        </select>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Fills demo account <code className="rounded bg-zinc-100 px-1 text-[0.8rem] dark:bg-zinc-900">user1@</code> /{" "}
          <code className="rounded bg-zinc-100 px-1 text-[0.8rem] dark:bg-zinc-900">vendor1@</code> /{" "}
          <code className="rounded bg-zinc-100 px-1 text-[0.8rem] dark:bg-zinc-900">admin1@</code> — password{" "}
          <code className="rounded bg-zinc-100 px-1 text-[0.8rem] dark:bg-zinc-900">cl@123</code>. You can edit before signing in.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-black"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-emerald-700 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
