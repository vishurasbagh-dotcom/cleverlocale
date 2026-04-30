"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function toggleVendorShopOpen(): Promise<{ ok: true; isShopOpen: boolean } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")) {
    return { ok: false, error: "Unauthorized" };
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true, isShopOpen: true, isAdminShopClosed: true },
  });

  if (!vendor) {
    return { ok: false, error: "No vendor profile." };
  }
  if (vendor.status !== "APPROVED") {
    return { ok: false, error: "Shop must be approved before you can open or close it on the marketplace." };
  }
  if (vendor.isAdminShopClosed) {
    return {
      ok: false,
      error: "CL Admin has temporarily closed your shop. Contact support or wait until they lift the closure.",
    };
  }

  const nextOpen = !vendor.isShopOpen;
  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data: { isShopOpen: nextOpen },
    select: { isShopOpen: true },
  });

  revalidatePath("/vendor");
  revalidatePath("/vendor/shop");
  revalidatePath("/vendor/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true, isShopOpen: updated.isShopOpen };
}
