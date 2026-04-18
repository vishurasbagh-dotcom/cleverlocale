import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CartLines } from "@/components/cart-lines";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { include: { vendor: true } } } },
    },
  });

  const lines = cart?.items ?? [];
  const subtotalPaise = lines.reduce((sum, l) => sum + l.product.pricePaise * l.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Cart</h1>
      {lines.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">
          Your cart is empty.{" "}
          <Link href="/products" className="font-medium text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-400">
            Browse products
          </Link>
        </p>
      ) : (
        <>
          <CartLines items={lines} />
          <div className="mt-8 flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <p className="text-lg font-medium">
              Subtotal: <span className="text-emerald-800 dark:text-emerald-400">{formatInr(subtotalPaise)}</span>
            </p>
            <Link
              href="/checkout"
              className="inline-flex w-fit rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Proceed to checkout (dummy)
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
