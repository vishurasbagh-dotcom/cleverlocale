import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductPurchaseSection } from "@/components/product-purchase-section";
import { isValidVariantHex } from "@/lib/variant-color-presets";
import { getMarketplaceVendorWhere, storefrontVendorSelect } from "@/lib/marketplace-vendor";
import { productListPricePaise, productShowFromLabel, productTotalStock } from "@/lib/product-display";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

type Props = { params: Promise<{ vendorSlug: string; productSlug: string }> };

export default async function ProductPage({ params }: Props) {
  const { vendorSlug, productSlug } = await params;
  const marketplaceVendor = await getMarketplaceVendorWhere({ slug: vendorSlug });

  const product = await prisma.product.findFirst({
    where: {
      isPublished: true,
      slug: productSlug,
      vendor: marketplaceVendor,
    },
    include: {
      vendor: { select: storefrontVendorSelect },
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) notFound();

  const listPaise = productListPricePaise(product);
  const showFrom = productShowFromLabel(product);
  const totalStock = productTotalStock(product);
  const primaryImage = product.images[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-zinc-500">
        <Link href="/products" className="hover:underline">
          Shop
        </Link>{" "}
        / {product.vendor.shopName}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>

      {primaryImage ? (
        <div className="relative mt-6 aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
          <Image
            src={`/api/product-image/${product.id}/${primaryImage.storedName}`}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 36rem"
            unoptimized
          />
        </div>
      ) : null}

      {product.images.length > 1 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {product.images.slice(1).map((im) => (
            <li key={im.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Image
                src={`/api/product-image/${product.id}/${im.storedName}`}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-6 text-2xl font-medium text-emerald-800 dark:text-emerald-400">
        {showFrom ? <>From {formatInr(listPaise)}</> : formatInr(listPaise)}
      </p>

      {product.category && <p className="mt-2 text-sm text-zinc-500">Category: {product.category.name}</p>}
      {product.description && (
        <p className="mt-6 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{product.description}</p>
      )}

      {product.variants.length > 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">Options</p>
          <ul className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            {product.variants.map((v) => {
              const bits = [product.variantLabel1 && v.value1 ? `${product.variantLabel1}: ${v.value1}` : v.value1].filter(
                Boolean,
              );
              if (product.variantLabel2 && v.value2) bits.push(`${product.variantLabel2}: ${v.value2}`);
              else if (v.value2) bits.push(v.value2);
              if (product.variantLabel3 && v.value3) bits.push(`${product.variantLabel3}: ${v.value3}`);
              else if (v.value3) bits.push(v.value3);
              const showC = product.useVariantColors;
              return (
                <li key={v.id} className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1">
                    {showC && isValidVariantHex(v.color1) ? (
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-600"
                        style={{ backgroundColor: v.color1 }}
                        title={v.color1}
                      />
                    ) : null}
                    {showC && isValidVariantHex(v.color2) ? (
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-600"
                        style={{ backgroundColor: v.color2 }}
                        title={v.color2}
                      />
                    ) : null}
                    {showC && isValidVariantHex(v.color3) ? (
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-zinc-200 dark:border-zinc-600"
                        style={{ backgroundColor: v.color3 }}
                        title={v.color3}
                      />
                    ) : null}
                  </span>
                  <span>
                    {bits.filter(Boolean).join(" · ") || "—"}
                    {v.stock < 1 ? <span className="text-amber-700 dark:text-amber-400"> (out of stock)</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-sm text-zinc-500">
        {totalStock > 0 ? `${totalStock} total in stock` : "Out of stock"}
      </p>

      <div className="mt-8">
        <ProductPurchaseSection
          productId={product.id}
          pricePaise={product.pricePaise}
          useVariantPricing={product.useVariantPricing}
          useVariantColors={product.useVariantColors}
          variantLabel1={product.variantLabel1}
          variantLabel2={product.variantLabel2}
          variantLabel3={product.variantLabel3}
          variants={product.variants.map((v) => ({
            id: v.id,
            value1: v.value1,
            value2: v.value2,
            value3: v.value3,
            color1: v.color1,
            color2: v.color2,
            color3: v.color3,
            stock: v.stock,
            pricePaise: v.pricePaise,
          }))}
          baseStock={product.stock}
        />
      </div>
    </div>
  );
}
