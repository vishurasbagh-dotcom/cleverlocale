import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { getMarketplaceVendorWhere, storefrontVendorSelect } from "@/lib/marketplace-vendor";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/money";

type Props = { params: Promise<{ vendorSlug: string; productSlug: string }> };

export default async function ProductPage({ params }: Props) {
  const { vendorSlug, productSlug } = await params;

  const product = await prisma.product.findFirst({
    where: {
      isPublished: true,
      slug: productSlug,
      vendor: await getMarketplaceVendorWhere({ slug: vendorSlug }),
    },
    include: { vendor: { select: storefrontVendorSelect }, category: true },
  });

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-zinc-500">
        <Link href="/products" className="hover:underline">
          Shop
        </Link>{" "}
        / {product.vendor.shopName}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
      <p className="mt-4 text-2xl font-medium text-emerald-800 dark:text-emerald-400">{formatInr(product.pricePaise)}</p>
      {product.category && <p className="mt-2 text-sm text-zinc-500">Category: {product.category.name}</p>}
      {product.description && (
        <p className="mt-6 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{product.description}</p>
      )}
      <p className="mt-4 text-sm text-zinc-500">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>

      <div className="mt-8">
        <AddToCartForm productId={product.id} disabled={product.stock < 1} />
      </div>
    </div>
  );
}
