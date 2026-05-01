"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string; redirectTo?: string };

type LoginKind = "customer" | "vendor" | "admin";

function defaultTargetForRole(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "vendor") return "/vendor";
  return "/";
}

function sanitizeCallbackUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return "";
  try {
    // Server-side: only allow in-app relative paths.
    if (raw.startsWith("/")) return raw;
    const parsed = new URL(raw);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "";
  }
}

export async function loginWithCredentials(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = sanitizeCallbackUrl(String(formData.get("callbackUrl") ?? ""));
  const loginKindRaw = String(formData.get("loginKind") ?? "").trim();
  const loginKind: LoginKind =
    loginKindRaw === "vendor" || loginKindRaw === "admin" ? loginKindRaw : "customer";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const redirectTo = callbackUrl || defaultTargetForRole(loginKind);

  try {
    const url = (await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo,
    })) as string;
    return { redirectTo: url || redirectTo };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return {
          error: "Invalid email or password for this account type. Use the email you registered for the role you selected.",
        };
      }
      return { error: "Could not sign in right now. Please try again." };
    }
    throw err;
  }
}
