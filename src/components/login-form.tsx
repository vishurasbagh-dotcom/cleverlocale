"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithCredentials, type LoginState } from "@/actions/login";

const DEMO = {
  customer: { email: "user1@cleverlocale.local", password: "cl@123", label: "Customer" },
    vendor: { email: "mumbai-masala-mart@cleverlocale.local", password: "cl@123", label: "Vendor" },
  admin: { email: "admin1@cleverlocale.local", password: "cl@123", label: "CL Admin" },
} as const;

type LoginKind = keyof typeof DEMO;

function parseLoginKind(v: string | undefined): LoginKind | null {
  if (v === "customer" || v === "vendor" || v === "admin") return v;
  return null;
}

function resolveKind(kind: string | undefined): LoginKind {
  return parseLoginKind(kind) ?? "customer";
}

function stateForKind(k: LoginKind): { kind: LoginKind; email: string; password: string } {
  const row = DEMO[k];
  return { kind: k, email: row.email, password: row.password };
}

function defaultTargetForRole(role: LoginKind): string {
  if (role === "admin") return "/admin";
  if (role === "vendor") return "/vendor";
  return "/";
}

function normalizeCallbackUrl(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.origin !== window.location.origin) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

const ROLE_ORDER: LoginKind[] = ["customer", "vendor", "admin"];

export function LoginForm({
  callbackUrl,
  vendorRegistered,
  initialKind,
}: {
  callbackUrl?: string;
  vendorRegistered?: boolean;
  initialKind?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginWithCredentials, {} as LoginState);
  const init = stateForKind(resolveKind(vendorRegistered ? "vendor" : initialKind));
  const [loginKind, setLoginKind] = useState<LoginKind>(init.kind);
  const [email, setEmail] = useState(init.email);
  const [password, setPassword] = useState(init.password);
  const normalizedCallbackUrl = normalizeCallbackUrl(callbackUrl);

  useEffect(() => {
    const k = resolveKind(vendorRegistered ? "vendor" : initialKind);
    const next = stateForKind(k);
    setLoginKind(next.kind);
    setEmail(next.email);
    setPassword(next.password);
  }, [initialKind, vendorRegistered]);

  useEffect(() => {
    const target = normalizedCallbackUrl || defaultTargetForRole(loginKind);
    router.prefetch(target);
  }, [normalizedCallbackUrl, loginKind, router]);

  useEffect(() => {
    if (!state.redirectTo) return;
    try {
      const parsed = new URL(state.redirectTo, window.location.origin);
      if (parsed.origin === window.location.origin) {
        router.replace(parsed.pathname + parsed.search + parsed.hash);
        return;
      }
    } catch {
      // Fall back for malformed URL.
    }
    window.location.assign(state.redirectTo);
  }, [state.redirectTo, router]);

  function selectRole(k: LoginKind) {
    setLoginKind(k);
    const row = DEMO[k];
    setEmail(row.email);
    setPassword(row.password);
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border-2 border-emerald-600 bg-white p-6 shadow-xl shadow-emerald-900/10 ring-4 ring-emerald-500/15 dark:border-emerald-500 dark:bg-zinc-950 dark:ring-emerald-400/20"
      aria-labelledby="login-panel-title"
    >
      {vendorRegistered && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
          Vendor application received. Sign in with your <strong>business email</strong> and the password you created to
          track approval (Approved, On hold, or Rejected).
        </p>
      )}
      <h2 id="login-panel-title" className="sr-only">
        Sign in to Cleverlocale
      </h2>

      <fieldset className="border-0 p-0">
        <legend className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Account type</legend>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {ROLE_ORDER.map((value) => (
            <label
              key={value}
              className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100"
            >
              <input
                type="radio"
                name="accountTypeUi"
                value={value}
                checked={loginKind === value}
                onChange={() => selectRole(value)}
                className="size-4 shrink-0 border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-900"
              />
              {DEMO[value].label}
            </label>
          ))}
        </div>
      </fieldset>

      <form action={formAction} className="flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <input type="hidden" name="callbackUrl" value={normalizedCallbackUrl || ""} readOnly />
        <input type="hidden" name="loginKind" value={loginKind} readOnly />
        {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
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

      {loginKind === "customer" ? (
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          New customer?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            Create an account
          </Link>
        </p>
      ) : null}
    </div>
  );
}
