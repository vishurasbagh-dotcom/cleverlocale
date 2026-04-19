import Link from "next/link";
import { LoginForm } from "@/components/login-form";

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <LoginForm callbackUrl={callbackUrl} />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        No User / Customer Account?{" "}
        <Link href="/register" className="font-medium text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-400">
          Register
        </Link>
      </p>
    </div>
  );
}
