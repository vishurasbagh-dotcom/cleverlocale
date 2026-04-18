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

export async function addToCart(productId: string, quantity = 1) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in required" };
  }
  const product = await prisma.product.findFirst({
    where: { id: productId, isPublished: true },
  });
  if (!product) {
    return { error: "Product not found" };
  }
  if (product.stock < quantity) {
    return { error: "Not enough stock" };
  }

  const cartId = await getOrCreateCartId(session.user.id);

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: { cartId, productId: product.id },
    },
    update: { quantity: { increment: quantity } },
    create: { cartId, productId: product.id, quantity },
  });

  revalidatePath("/cart");
  revalidatePath("/p");
  return { success: true };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in required" };
  if (quantity < 1) {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, cart: { userId: session.user.id } },
    });
  } else {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cart: { userId: session.user.id } },
      include: { product: true },
    });
    if (!item) return { error: "Item not found" };
    if (item.product.stock < quantity) {
      return { error: "Not enough stock" };
    }
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }
  revalidatePath("/cart");
  return { success: true };
}
