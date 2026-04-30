"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import type { VendorStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const statusSchema = z.object({
  vendorId: z.string().min(1),
  status: z.enum(["PENDING", "ON_HOLD", "APPROVED", "REJECTED", "SUSPENDED"]),
  correctionNotes: z.string().max(5000).optional(),
  sendBackToVendor: z.string().optional(),
  requestVendorDetails: z.string().optional(),
});

const createVendorSchema = z.object({
  shopName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(120),
  mobileNumber: z.string().regex(/^\d{10}$/),
  city: z.string().max(120).optional(),
  status: z.enum(["PENDING", "ON_HOLD", "APPROVED", "REJECTED", "SUSPENDED"]).default("PENDING"),
});

async function uniqueVendorSlug(baseName: string): Promise<string> {
  const base = slugify(baseName) || "shop";
  let candidate = base;
  let n = 0;
  while (await prisma.vendor.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

export async function createVendorByAdmin(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return;
  }

  const parsed = createVendorSchema.safeParse({
    shopName: formData.get("shopName"),
    email: formData.get("email"),
    password: formData.get("password"),
    mobileNumber: formData.get("mobileNumber"),
    city: formData.get("city") || undefined,
    status: formData.get("status") || "PENDING",
  });
  if (!parsed.success) return;

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (existingUser) {
    const existingVendor = await prisma.vendor.findUnique({ where: { userId: existingUser.id }, select: { id: true } });
    if (existingVendor) {
      return;
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const slug = await uniqueVendorSlug(data.shopName);
  const isShopOpen = data.status === "APPROVED";

  await prisma.$transaction(async (tx) => {
    const user =
      existingUser?.id
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: { role: "VENDOR", passwordHash },
            select: { id: true },
          })
        : await tx.user.create({
            data: {
              email,
              passwordHash,
              role: "VENDOR",
              name: data.shopName.trim(),
              cart: { create: {} },
            },
            select: { id: true },
          });

    await tx.vendor.create({
      data: {
        userId: user.id,
        shopName: data.shopName.trim(),
        mobileNumber: data.mobileNumber.trim(),
        slug,
        status: data.status as VendorStatus,
        isShopOpen,
        isAdminShopClosed: false,
        city: data.city?.trim() || null,
      },
    });
  });

  revalidatePath("/admin/vendors");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function updateVendorRegistrationStatus(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return;
  }

  const parsed = statusSchema.safeParse({
    vendorId: formData.get("vendorId"),
    status: formData.get("status"),
    correctionNotes: formData.get("correctionNotes") || undefined,
    sendBackToVendor: formData.get("sendBackToVendor") || undefined,
    requestVendorDetails: formData.get("requestVendorDetails") || undefined,
  });
  if (!parsed.success) return;

  const { vendorId, status } = parsed.data;
  const correctionNotes = parsed.data.correctionNotes?.trim() || "";
  const shouldSendBack = parsed.data.sendBackToVendor === "1";
  const shouldRequestDetails = parsed.data.requestVendorDetails === "1";
  const resolvedStatus = shouldSendBack ? "ON_HOLD" : status;

  const prev = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { status: true, userId: true },
  });
  if (!prev) return;

  // For approved shops, admin can request more details without affecting live listing/status.
  if (shouldRequestDetails && prev.status === "APPROVED") {
    if (!correctionNotes) return;
    await prisma.$executeRaw`
      UPDATE "vendors"
      SET "correction_notes" = ${correctionNotes}
      WHERE "id" = ${vendorId}
    `;
    revalidatePath("/admin/vendors");
    revalidatePath("/vendor");
    revalidatePath("/vendor/shop");
    revalidatePath("/register/vendor");
    return;
  }

  // Rejected applications are deprecated from the system; vendor must submit a fresh application.
  if (resolvedStatus === "REJECTED") {
    await prisma.$transaction(async (tx) => {
      await tx.vendor.delete({
        where: { id: vendorId },
      });
      await tx.user.update({
        where: { id: prev.userId },
        data: { role: "CUSTOMER" },
      });
    });
    revalidatePath("/admin/vendors");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/vendor");
    revalidatePath("/register/vendor");
    return;
  }

  if (resolvedStatus === "ON_HOLD" && !correctionNotes) {
    return;
  }

  const data: { status: VendorStatus; isShopOpen?: boolean; isAdminShopClosed?: boolean } = {
    status: resolvedStatus as VendorStatus,
  };

  if (resolvedStatus !== "APPROVED") {
    data.isShopOpen = false;
    data.isAdminShopClosed = false;
  } else if (prev.status !== "APPROVED") {
    data.isShopOpen = true;
  }

  await prisma.vendor.update({
    where: { id: vendorId },
    data,
  });
  await prisma.$executeRaw`
    UPDATE "vendors"
    SET "correction_notes" = ${resolvedStatus === "ON_HOLD" ? correctionNotes : null}
    WHERE "id" = ${vendorId}
  `;

  revalidatePath("/admin/vendors");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/vendor");
  revalidatePath("/vendor/shop");
  revalidatePath("/register/vendor");
}

export async function toggleAdminVendorShopClosed(
  vendorId: string,
): Promise<{ ok: true; isAdminShopClosed: boolean } | { ok: false; error: string }> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized" };
  }
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { status: true, isAdminShopClosed: true },
  });
  if (!vendor || vendor.status !== "APPROVED") {
    return { ok: false, error: "Only approved vendors can use admin shop closure." };
  }
  const updated = await prisma.vendor.update({
    where: { id: vendorId },
    data: { isAdminShopClosed: !vendor.isAdminShopClosed },
    select: { isAdminShopClosed: true },
  });
  revalidatePath("/admin/vendors");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/vendor");
  revalidatePath("/vendor/shop");
  revalidatePath("/vendor/products");
  return { ok: true, isAdminShopClosed: updated.isAdminShopClosed };
}
