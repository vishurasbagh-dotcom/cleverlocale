"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getOrCreateCartId(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing.id;
  const cart = await prisma.cart.create({ data: { userId } });
  return cart.id;
}

export async function addToCart(productId: string, quantity = 1, productVariantId?: string | null) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in required" };
  }
  const parsed = Math.floor(Number(quantity));
  const qty = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;

  const product = await prisma.product.findFirst({
    where: { id: productId, isPublished: true },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) {
    return { error: "Product not found" };
  }

  let maxAllowed = product.stock;
  if (product.variants.length > 0) {
    if (!productVariantId) {
      return { error: "Choose an option before adding to cart." };
    }
    const variant = product.variants.find((v) => v.id === productVariantId);
    if (!variant) {
      return { error: "That option is not available." };
    }
    maxAllowed = variant.stock;
  }

  if (maxAllowed < 1) {
    return { error: product.variants.length > 0 ? "Out of stock for this option." : "Out of stock" };
  }

  const cartId = await getOrCreateCartId(session.user.id);
  const variantKey = productVariantId ?? null;

  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId: product.id, productVariantId: variantKey },
  });

  const requestedTotal = existing ? existing.quantity + qty : qty;
  if (requestedTotal > maxAllowed) {
    return {
      error:
        existing && qty > 0
          ? `You already have ${existing.quantity} in cart. Only ${maxAllowed} available — reduce quantity or update your cart.`
          : `Maximum you can add is ${maxAllowed} (in stock).`,
    };
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: qty } },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId,
        productId: product.id,
        productVariantId: variantKey,
        quantity: qty,
      },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/p");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in required" };
  const parsed = Math.floor(Number(quantity));
  if (!Number.isFinite(parsed)) {
    return { error: "Invalid quantity" };
  }
  if (parsed < 1) {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, cart: { userId: session.user.id } },
    });
  } else {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cart: { userId: session.user.id } },
      include: { product: { include: { variants: true } }, productVariant: true },
    });
    if (!item) return { error: "Item not found" };

    let maxStock = item.product.stock;
    if (item.product.variants.length > 0) {
      maxStock = item.productVariant?.stock ?? 0;
    }

    const q = Math.min(parsed, Math.max(0, maxStock));
    if (maxStock < 1 || q < 1) {
      await prisma.cartItem.deleteMany({
        where: { id: cartItemId, cart: { userId: session.user.id } },
      });
    } else {
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: q },
      });
    }
  }
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeFromCart(cartItemId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in required" };
  const deleted = await prisma.cartItem.deleteMany({
    where: { id: cartItemId, cart: { userId: session.user.id } },
  });
  if (deleted.count === 0) return { error: "Item not found" };
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}
