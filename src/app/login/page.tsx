import { LoginForm } from "@/components/login-form";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; registered?: string; as?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl, registered, as } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Sign in</h1>
      </div>

      <LoginForm
        callbackUrl={callbackUrl}
        vendorRegistered={registered === "vendor"}
        initialKind={as}
      />
    </div>
  );
}
