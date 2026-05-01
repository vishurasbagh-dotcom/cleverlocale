import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { lines: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Your orders</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Dummy checkout — orders are stored as CONFIRMED.</p>

      {orders.length === 0 ? (
        <p className="mt-8 text-zinc-600 dark:text-zinc-400">
          No orders yet.{" "}
          <Link href="/products" className="font-medium text-emerald-800 hover:underline dark:text-emerald-400">
            Shop
          </Link>
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-zinc-500">
                  {o.createdAt.toLocaleString("en-IN")}
                </span>
                <span className="text-sm">
                  {o.status} · {formatInr(o.totalPaise)}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {o.lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-4">
                    <span>
                      {l.productName}
                      {l.variantSummary ? (
                        <span className="mt-0.5 block text-xs text-zinc-500">{l.variantSummary}</span>
                      ) : null}
                      <span className="text-zinc-500"> × {l.quantity}</span>
                    </span>
                    <span>{formatInr(l.lineTotalPaise)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
