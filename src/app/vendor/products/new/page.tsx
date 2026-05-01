import { auth } from "@/auth";
import { VendorProductForm } from "@/components/vendor-product-form";
import { buildCategoryTree } from "@/lib/category-tree";
import { prisma } from "@/lib/prisma";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";

export default async function NewVendorProductPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { status: true, isShopOpen: true, isAdminShopClosed: true },
  });
  if (!vendor || vendor.status !== "APPROVED") {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        New product creation is available only after your vendor registration is approved.
      </p>
    );
  }
  if (!vendorShopfrontLive(vendor)) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        You can add products only while your shop is live on the marketplace. Open it from the dashboard, or wait if CL Admin
        has temporarily closed your shop.
      </p>
    );
  }

  const rows = await prisma.category.findMany({
    select: { id: true, parentId: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });
  const categoryTree = buildCategoryTree(rows);

  return (
    <div>
      <h1 className="text-2xl font-semibold">New product</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Choose a category and subcategory, add photos, and optionally set sizes or other options. Ask a CL Admin to add
        categories if something is missing.
      </p>
      {categoryTree.length === 0 ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          No categories are available yet. A CL Admin must add categories under Admin → Categories.
        </p>
      ) : (
        <VendorProductForm categoryTree={categoryTree} />
      )}
    </div>
  );
}
