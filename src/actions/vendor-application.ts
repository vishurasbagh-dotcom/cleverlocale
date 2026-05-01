"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveVendorCertificate } from "@/lib/vendor-cert-upload";
import { slugify } from "@/lib/slug";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";

export type VendorApplicationState = { error?: string; success?: string };

const shopSchema = z.object({
  shopName: z.string().min(2).max(120),
  mobileNumber: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits."),
  shopDescription: z.string().max(5000).optional(),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  locality: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits."),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

const accountSchema = z.object({
  businessEmail: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

async function uniqueVendorSlug(base: string): Promise<string> {
  let candidate = slugify(base) || "shop";
  let n = 0;
  while (await prisma.vendor.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    n += 1;
    candidate = `${slugify(base) || "shop"}-${n}`;
  }
  return candidate;
}

async function createVendorRecord(params: {
  userId: string;
  data: z.infer<typeof shopSchema>;
  categoryIds: string[];
  lat: number | null;
  lng: number | null;
  slug: string;
  certFile: File | null;
}) {
  const { userId, data, categoryIds, lat, lng, slug, certFile } = params;

  const vendor = await prisma.vendor.create({
    data: {
      userId,
      shopName: data.shopName.trim(),
      mobileNumber: data.mobileNumber.trim(),
      slug,
      status: "PENDING",
      isShopOpen: false,
      shopDescription: data.shopDescription?.trim() || null,
      correctionNotes: null,
      shopLocation: {
        create: {
          addressLine1: data.addressLine1.trim(),
          addressLine2: data.addressLine2?.trim() || null,
          locality: data.locality.trim(),
          city: data.city.trim(),
          pincode: data.pincode.trim(),
          latitude: lat,
          longitude: lng,
        },
      },
      sellingCategories: {
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
  });

  if (certFile instanceof File && certFile.size > 0) {
    try {
      const saved = await saveVendorCertificate(vendor.id, certFile);
      if (saved) {
        await prisma.vendorCertificate.create({
          data: {
            vendorId: vendor.id,
            storedName: saved.storedName,
            originalName: saved.originalName,
            mimeType: saved.mimeType,
          },
        });
      }
    } catch (err) {
      await prisma.vendor.delete({ where: { id: vendor.id } });
      throw err;
    }
  }

  return vendor;
}

export async function submitVendorApplication(
  _prev: VendorApplicationState,
  formData: FormData,
): Promise<VendorApplicationState> {
  void _prev;
  const mode = formData.get("applicationMode");
  const isGuest = mode === "guest";

  const categoryIds = formData.getAll("categoryIds").filter((v): v is string => typeof v === "string" && v.length > 0);

  if (categoryIds.length === 0) {
    return { error: "Select at least one product category you plan to sell in." };
  }

  const latRaw = formData.get("latitude");
  const lngRaw = formData.get("longitude");
  const parsedShop = shopSchema.safeParse({
    shopName: formData.get("shopName"),
    mobileNumber: formData.get("mobileNumber"),
    shopDescription: formData.get("shopDescription") || undefined,
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    locality: formData.get("locality"),
    city: formData.get("city"),
    pincode: formData.get("pincode"),
    latitude: latRaw && String(latRaw).trim() !== "" ? Number(latRaw) : undefined,
    longitude: lngRaw && String(lngRaw).trim() !== "" ? Number(lngRaw) : undefined,
  });

  if (!parsedShop.success) {
    return { error: parsedShop.error.flatten().formErrors.join(" ") || "Invalid input." };
  }

  const cats = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });
  if (cats.length !== categoryIds.length) {
    return { error: "One or more selected categories are invalid." };
  }

  const data = parsedShop.data;
  const lat = data.latitude !== undefined && !Number.isNaN(data.latitude) ? data.latitude : null;
  const lng = data.longitude !== undefined && !Number.isNaN(data.longitude) ? data.longitude : null;
  const slug = await uniqueVendorSlug(data.shopName);
  const certFile = formData.get("certificate");

  const shopPayload = { data, categoryIds, lat, lng, slug, certFile: certFile instanceof File ? certFile : null };

  if (isGuest) {
    const accParsed = accountSchema.safeParse({
      businessEmail: formData.get("businessEmail"),
      password: formData.get("password"),
    });
    if (!accParsed.success) {
      return { error: accParsed.error.flatten().formErrors.join(" ") || "Check your email and password." };
    }
    const pwConfirm = formData.get("passwordConfirm");
    if (typeof pwConfirm !== "string" || pwConfirm !== accParsed.data.password) {
      return { error: "Passwords do not match." };
    }

    const email = accParsed.data.businessEmail.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account already exists with this email. Log in and continue from Register as a vendor, or use a different business email." };
    }

    const passwordHash = await bcrypt.hash(accParsed.data.password, 12);
    const contactName = typeof formData.get("contactName") === "string" ? String(formData.get("contactName")).trim() : "";

    let newVendorId = "";
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            name: contactName || null,
            role: "VENDOR",
            cart: { create: {} },
          },
        });

        const vendor = await tx.vendor.create({
          data: {
            userId: user.id,
            shopName: data.shopName.trim(),
            mobileNumber: data.mobileNumber.trim(),
            slug,
            status: "PENDING",
            isShopOpen: false,
            shopDescription: data.shopDescription?.trim() || null,
            shopLocation: {
              create: {
                addressLine1: data.addressLine1.trim(),
                addressLine2: data.addressLine2?.trim() || null,
                locality: data.locality.trim(),
                city: data.city.trim(),
                pincode: data.pincode.trim(),
                latitude: lat,
                longitude: lng,
              },
            },
            sellingCategories: {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
          },
        });
        newVendorId = vendor.id;
      });

      if (certFile instanceof File && certFile.size > 0 && newVendorId) {
        try {
          const saved = await saveVendorCertificate(newVendorId, certFile);
          if (saved) {
            await prisma.vendorCertificate.create({
              data: {
                vendorId: newVendorId,
                storedName: saved.storedName,
                originalName: saved.originalName,
                mimeType: saved.mimeType,
              },
            });
          }
        } catch (err) {
          await prisma.user.delete({ where: { email } });
          const msg = err instanceof Error ? err.message : "Could not store certificate.";
          return { error: msg };
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create your account.";
      return { error: msg };
    }

    revalidatePath("/");
    revalidatePath("/register/vendor");
    return {
      success:
        "Application submitted. Sign in with your business email and password anytime to check your approval status.",
    };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in or use the business email section to create an account." };
  }
  if (session.user.role === "ADMIN") {
    return { error: "Use a customer account to register as a vendor." };
  }

  const existingVendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
  });
  if (existingVendor) {
    const noteRows = await prisma.$queryRaw<Array<{ correction_notes: string | null }>>`
      SELECT "correction_notes" FROM "vendors" WHERE "id" = ${existingVendor.id} LIMIT 1
    `;
    const correctionNotesFromDb = noteRows[0]?.correction_notes ?? existingVendor.correctionNotes;
    const isApprovedDetailsUpdate =
      existingVendor.status === "APPROVED" && Boolean(correctionNotesFromDb?.trim());
    if (isApprovedDetailsUpdate && !vendorShopfrontLive(existingVendor)) {
      return {
        error:
          "Your shop must be live on the marketplace to submit these updates. Open it from the dashboard, or wait if CL Admin has temporarily closed your shop.",
      };
    }
    if (existingVendor.status === "APPROVED" && !isApprovedDetailsUpdate) {
      return {
        error: "This account already has an approved vendor profile.",
      };
    }
    if (existingVendor.status === "REJECTED" || existingVendor.status === "SUSPENDED") {
      return {
        error: "This vendor profile is not editable in current status. Contact Cleverlocale support.",
      };
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.vendorSellingCategory.deleteMany({
          where: { vendorId: existingVendor.id },
        });
        await tx.vendor.update({
          where: { id: existingVendor.id },
          data: {
            shopName: data.shopName.trim(),
            mobileNumber: data.mobileNumber.trim(),
            slug: existingVendor.slug,
            status: isApprovedDetailsUpdate ? "APPROVED" : "PENDING",
            isShopOpen: isApprovedDetailsUpdate ? existingVendor.isShopOpen : false,
            shopDescription: data.shopDescription?.trim() || null,
            shopLocation: {
              upsert: {
                create: {
                  addressLine1: data.addressLine1.trim(),
                  addressLine2: data.addressLine2?.trim() || null,
                  locality: data.locality.trim(),
                  city: data.city.trim(),
                  pincode: data.pincode.trim(),
                  latitude: lat,
                  longitude: lng,
                },
                update: {
                  addressLine1: data.addressLine1.trim(),
                  addressLine2: data.addressLine2?.trim() || null,
                  locality: data.locality.trim(),
                  city: data.city.trim(),
                  pincode: data.pincode.trim(),
                  latitude: lat,
                  longitude: lng,
                },
              },
            },
            sellingCategories: {
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
          },
        });
        await tx.$executeRaw`
          UPDATE "vendors"
          SET "correction_notes" = NULL
          WHERE "id" = ${existingVendor.id}
        `;
      });

      if (certFile instanceof File && certFile.size > 0) {
        const saved = await saveVendorCertificate(existingVendor.id, certFile);
        if (saved) {
          await prisma.vendorCertificate.upsert({
            where: { vendorId: existingVendor.id },
            create: {
              vendorId: existingVendor.id,
              storedName: saved.storedName,
              originalName: saved.originalName,
              mimeType: saved.mimeType,
            },
            update: {
              storedName: saved.storedName,
              originalName: saved.originalName,
              mimeType: saved.mimeType,
            },
          });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update application.";
      return { error: msg };
    }

    revalidatePath("/vendor");
    revalidatePath("/vendor/shop");
    revalidatePath("/register/vendor");
    revalidatePath("/admin/vendors");
    return {
      success: isApprovedDetailsUpdate
        ? "Details updated and shared with CL Admin."
        : "Application sent back for admin review.",
    };
  }

  try {
    await createVendorRecord({
      userId: session.user.id,
      ...shopPayload,
      certFile: certFile instanceof File ? certFile : null,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "VENDOR" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not save application.";
    return { error: msg };
  }

  revalidatePath("/");
  revalidatePath("/vendor");
  revalidatePath("/register/vendor");
  return {
    success:
      "Application submitted. Cleverlocale will review your shop. You can track status in your vendor dashboard.",
  };
}
