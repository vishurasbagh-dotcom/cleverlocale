"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function placeDummyOrder(
  _prev: { error?: string } | undefined,
  _formData: FormData,
): Promise<{ error?: string } | undefined> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { include: { vendor: true } } } },
    },
  });

  if (!cart?.items.length) {
    return { error: "Your cart is empty." };
  }

  let totalPaise = 0;
  const lineData: {
    productId: string;
    vendorId: string;
    productName: string;
    quantity: number;
    unitPaise: number;
    lineTotalPaise: number;
  }[] = [];

  for (const line of cart.items) {
    const p = line.product;
    if (p.stock < line.quantity) {
      return { error: `Not enough stock for ${p.name}.` };
    }
    const lineTotalPaise = p.pricePaise * line.quantity;
    totalPaise += lineTotalPaise;
    lineData.push({
      productId: p.id,
      vendorId: p.vendorId,
      productName: p.name,
      quantity: line.quantity,
      unitPaise: p.pricePaise,
      lineTotalPaise,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        userId: session.user.id,
        status: "CONFIRMED",
        totalPaise,
        currency: "INR",
        lines: {
          create: lineData.map((l) => ({
            productId: l.productId,
            vendorId: l.vendorId,
            productName: l.productName,
            quantity: l.quantity,
            unitPaise: l.unitPaise,
            lineTotalPaise: l.lineTotalPaise,
          })),
        },
      },
    });

    for (const line of cart.items) {
      await tx.product.update({
        where: { id: line.productId },
        data: { stock: { decrement: line.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  });

  revalidatePath("/account/orders");
  revalidatePath("/cart");
  redirect("/account/orders");
}
