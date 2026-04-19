import { CANONICAL_CATEGORY_SLUGS } from "@/lib/catalog-categories";
import { VendorProductForm } from "@/components/vendor-product-form";
import { prisma } from "@/lib/prisma";

export default async function NewVendorProductPage() {
  const categories = await prisma.category.findMany({
    where: { slug: { in: [...CANONICAL_CATEGORY_SLUGS] } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">New product</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Price in rupees (stored as paise). INR only.</p>
      <VendorProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
