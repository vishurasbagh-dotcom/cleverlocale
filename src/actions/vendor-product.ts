"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { categoryIsLeaf } from "@/lib/category-queries";
import { PRODUCT_IMAGE_MAX_FILES } from "@/lib/product-image-constants";
import { saveProductImageFile } from "@/lib/product-image-storage";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";
import { normalizeVariantColor } from "@/lib/variant-color-presets";

const variantRowSchema = z.object({
  value1: z.string().max(120),
  value2: z.string().max(120),
  value3: z.string().max(120),
  color1: z.unknown().optional(),
  color2: z.unknown().optional(),
  color3: z.unknown().optional(),
  stock: z.number().int().min(0),
  priceRupees: z.number().positive().optional().nullable(),
});

const variantsArraySchema = z.array(variantRowSchema).max(80);

export type ProductFormState = { error?: string; success?: boolean };

function parseVariantRows(raw: FormDataEntryValue | null): z.infer<typeof variantsArraySchema> {
  if (raw == null || raw === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    throw new Error("INVALID_VARIANTS_JSON");
  }
  return variantsArraySchema.parse(parsed);
}

export async function createVendorProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true, isShopOpen: true, isAdminShopClosed: true },
  });
  if (!vendor) {
    return { error: "Vendor profile not found." };
  }
  if (!vendorShopfrontLive(vendor)) {
    return {
      error:
        "Your shop must be live on the marketplace to add or change products. Open it from the vendor dashboard, or wait if CL Admin has temporarily closed your shop.",
    };
  }

  let variantRows: z.infer<typeof variantsArraySchema>;
  try {
    variantRows = parseVariantRows(formData.get("variantsJson"));
  } catch {
    return { error: "Invalid options / variants data. Refresh and try again." };
  }

  const rawSlug = formData.get("slug");
  const label1Raw = String(formData.get("variantLabel1") ?? "").trim();
  const label2Raw = String(formData.get("variantLabel2") ?? "").trim();
  const label3Raw = String(formData.get("variantLabel3") ?? "").trim();

  const base = {
    name: formData.get("name"),
    slug: rawSlug && String(rawSlug).trim() ? rawSlug : undefined,
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    isPublished: formData.get("isPublished") === "on",
  };

  const hasVariants = variantRows.length > 0;
  const useVariantColorsFlag = hasVariants && formData.get("useVariantColors") === "on";
  const nestDepthParsed = z.coerce.number().int().min(1).max(3).safeParse(formData.get("nestDepth"));
  const nestDepth = nestDepthParsed.success ? (nestDepthParsed.data as 1 | 2 | 3) : 1;

  const priceField = formData.get("priceRupees");
  const stockField = formData.get("stock");

  const priceRupeesParsed = z.coerce.number().nonnegative().safeParse(priceField);
  const stockParsed = z.coerce.number().int().min(0).safeParse(stockField);

  if (!hasVariants) {
    if (!priceRupeesParsed.success || priceRupeesParsed.data <= 0) {
      return { error: "Enter a valid price in INR." };
    }
    if (!stockParsed.success) {
      return { error: "Enter a valid stock quantity." };
    }
  } else {
    if (!nestDepthParsed.success) {
      return { error: "Invalid nesting depth. Refresh and try again." };
    }
    if (nestDepth === 1) {
      if (!label1Raw) {
        return { error: "Name level 1 (for example Size or Model)." };
      }
    } else if (nestDepth === 2) {
      if (!label1Raw || !label2Raw) {
        return { error: "Name level 1 and level 2 (for example Model and Storage)." };
      }
    } else {
      if (!label1Raw || !label2Raw || !label3Raw) {
        return { error: "Name all three option levels (for example Model, Storage, Color)." };
      }
    }
    for (const row of variantRows) {
      const v1 = row.value1.trim();
      const v2 = row.value2.trim();
      const v3 = row.value3.trim();
      if (nestDepth === 1) {
        if (!v1 || v2 !== "" || v3 !== "") {
          return {
            error: "For one-level options, fill only level 1 on each row; leave deeper levels unused.",
          };
        }
      } else if (nestDepth === 2) {
        if (!v1 || !v2 || v3 !== "") {
          return {
            error: "For two levels, fill level 1 and level 2 on each row. Level 3 must be empty.",
          };
        }
      } else if (!v1 || !v2 || !v3) {
        return {
          error:
            "Fill in every level for each combination: level 1, level 2, and level 3 (for example model, storage, color).",
        };
      }
    }
    for (const row of variantRows) {
      const p = row.priceRupees;
      if (p == null || p <= 0) {
        return { error: "Each variant needs its own price in INR." };
      }
    }
    for (const row of variantRows) {
      if (!Number.isInteger(row.stock) || row.stock < 0) {
        return { error: "Each variant needs a valid stock count." };
      }
    }
  }

  const nameParsed = z.string().min(1).max(200).safeParse(formData.get("name"));
  if (!nameParsed.success) {
    return { error: "Enter a product name." };
  }
  const name = nameParsed.data;
  const description = z.string().max(5000).optional().parse(formData.get("description") || undefined);

  const categoryId = z.string().min(1, "Select a category.").parse(formData.get("categoryId"));

  const slugSource = rawSlug != null && String(rawSlug).trim() !== "" ? String(rawSlug) : "";
  const slug = slugSource ? slugify(slugSource) : slugify(name);

  const clash = await prisma.product.findUnique({
    where: { vendorId_slug: { vendorId: vendor.id, slug } },
  });
  if (clash) {
    return { error: "Another product already uses this URL slug. Change the name or slug." };
  }

  const cat = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!cat || !(await categoryIsLeaf(categoryId))) {
    return {
      error:
        "Choose a shelf category — the most specific subcategory (no further subcategories under it). Ask CL Admin to add categories if needed.",
    };
  }
  const resolvedCategoryId = cat.id;

  const seen = new Set<string>();
  for (const row of variantRows) {
    const k = `${row.value1.trim()}\0${row.value2.trim()}\0${row.value3.trim()}`;
    if (seen.has(k)) {
      return { error: "Duplicate combination — each model + group + final option must be unique." };
    }
    seen.add(k);
  }

  const imageEntries = formData
    .getAll("images")
    .filter((x): x is File => typeof File !== "undefined" && x instanceof File && x.size > 0);
  if (imageEntries.length > PRODUCT_IMAGE_MAX_FILES) {
    return { error: `At most ${PRODUCT_IMAGE_MAX_FILES} images per product.` };
  }

  const finalPricePaise = hasVariants
    ? 0
    : Math.round(priceRupeesParsed.data! * 100);

  const finalStock = hasVariants
    ? variantRows.reduce((s, r) => s + r.stock, 0)
    : stockParsed.success
      ? stockParsed.data
      : 0;

  let createdId: string | undefined;
  try {
    const product = await prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: resolvedCategoryId,
          name,
          slug,
          description: description || null,
          pricePaise: finalPricePaise,
          stock: finalStock,
          isPublished: Boolean(base.isPublished),
          variantLabel1: hasVariants ? label1Raw : null,
          variantLabel2: hasVariants && nestDepth >= 2 ? label2Raw : null,
          variantLabel3: hasVariants && nestDepth >= 3 ? label3Raw : null,
          useVariantPricing: hasVariants,
          useVariantColors: useVariantColorsFlag,
          variants: hasVariants
            ? {
                create: variantRows.map((r, i) => ({
                  value1: r.value1.trim(),
                  value2: r.value2.trim(),
                  value3: r.value3.trim(),
                  color1: useVariantColorsFlag ? normalizeVariantColor(r.color1) : null,
                  color2: useVariantColorsFlag ? normalizeVariantColor(r.color2) : null,
                  color3: useVariantColorsFlag ? normalizeVariantColor(r.color3) : null,
                  stock: r.stock,
                  sortOrder: i,
                  pricePaise: Math.round((r.priceRupees ?? 0) * 100),
                })),
              }
            : undefined,
        },
      });
    });
    createdId = product.id;

    for (let i = 0; i < imageEntries.length; i++) {
      const storedName = await saveProductImageFile(product.id, imageEntries[i]!);
      await prisma.productImage.create({
        data: { productId: product.id, storedName, sortOrder: i },
      });
    }
  } catch (e) {
    if (createdId) {
      await prisma.product.delete({ where: { id: createdId } }).catch(() => {});
    }
    const msg = e instanceof Error ? e.message : "Could not create product.";
    return { error: msg };
  }

  revalidatePath("/vendor/products");
  revalidatePath("/products");
  revalidatePath("/p");
  revalidatePath("/");
  return { success: true };
}
