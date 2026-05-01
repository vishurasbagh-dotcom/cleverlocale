import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutForm } from "@/components/checkout-form";
import { prisma } from "@/lib/prisma";
import { variantUnitPaise } from "@/lib/product-display";
import { formatInr } from "@/lib/money";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: { items: { include: { product: true, productVariant: true } } },
  });

  const lines = cart?.items ?? [];
  const totalPaise = lines.reduce((sum, l) => {
    const unit = l.productVariant
      ? variantUnitPaise(l.product, l.productVariant)
      : variantUnitPaise(l.product, { pricePaise: null });
    return sum + unit * l.quantity;
  }, 0);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Your cart is empty.{" "}
          <Link href="/products" className="font-medium text-emerald-800 hover:underline dark:text-emerald-400">
            Continue shopping
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Currency: INR (stored as paise in the database).</p>

      <ul className="mt-6 space-y-2 text-sm">
        {lines.map((l) => {
          const unit = l.productVariant
            ? variantUnitPaise(l.product, l.productVariant)
            : variantUnitPaise(l.product, { pricePaise: null });
          return (
            <li key={l.id} className="flex justify-between gap-4">
              <span>
                {l.product.name} × {l.quantity}
              </span>
              <span>{formatInr(unit * l.quantity)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 border-t border-zinc-200 pt-4 text-lg font-medium dark:border-zinc-800">
        Total: <span className="text-emerald-800 dark:text-emerald-400">{formatInr(totalPaise)}</span>
      </p>

      <CheckoutForm />
    </div>
  );
}
