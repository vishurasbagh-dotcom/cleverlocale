"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatVariantSummary, variantUnitPaise } from "@/lib/product-display";
import { storefrontVendorSelect } from "@/lib/marketplace-vendor";
import { prisma } from "@/lib/prisma";

export async function placeDummyOrder(
  _prev: { error?: string } | undefined,
  _formData: FormData,
): Promise<{ error?: string } | undefined> {
  void _prev;
  void _formData;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { include: { vendor: { select: storefrontVendorSelect }, variants: true } },
          productVariant: true,
        },
      },
    },
  });

  if (!cart?.items.length) {
    return { error: "Your cart is empty." };
  }

  let totalPaise = 0;
  const lineData: {
    productId: string;
    vendorId: string;
    productVariantId: string | null;
    variantSummary: string | null;
    productName: string;
    quantity: number;
    unitPaise: number;
    lineTotalPaise: number;
  }[] = [];

  for (const line of cart.items) {
    const p = line.product;
    const unitPaise = line.productVariant
      ? variantUnitPaise(p, line.productVariant)
      : variantUnitPaise(p, { pricePaise: null });
    if (line.productVariant) {
      if (line.productVariant.stock < line.quantity) {
        const opt = formatVariantSummary(
          p.variantLabel1,
          p.variantLabel2,
          line.productVariant.value1,
          line.productVariant.value2,
          p.variantLabel3,
          line.productVariant.value3,
        );
        return { error: `Not enough stock for ${p.name}${opt ? ` (${opt})` : ""}.` };
      }
    } else if (p.variants.length > 0) {
      return { error: `Each item with options needs a variant in the cart. Remove ${p.name} and add it again.` };
    } else if (p.stock < line.quantity) {
      return { error: `Not enough stock for ${p.name}.` };
    }

    const lineTotalPaise = unitPaise * line.quantity;
    totalPaise += lineTotalPaise;
    const variantSummary = line.productVariant
      ? formatVariantSummary(
          p.variantLabel1,
          p.variantLabel2,
          line.productVariant.value1,
          line.productVariant.value2,
          p.variantLabel3,
          line.productVariant.value3,
        )
      : null;
    lineData.push({
      productId: p.id,
      vendorId: p.vendorId,
      productVariantId: line.productVariantId,
      variantSummary,
      productName: p.name,
      quantity: line.quantity,
      unitPaise,
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
            productVariantId: l.productVariantId,
            variantSummary: l.variantSummary,
            productName: l.productName,
            quantity: l.quantity,
            unitPaise: l.unitPaise,
            lineTotalPaise: l.lineTotalPaise,
          })),
        },
      },
    });

    for (const line of cart.items) {
      if (line.productVariantId) {
        await tx.productVariant.update({
          where: { id: line.productVariantId },
          data: { stock: { decrement: line.quantity } },
        });
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  });

  revalidatePath("/account/orders");
  revalidatePath("/cart");
  redirect("/account/orders");
}
