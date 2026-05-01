import Link from "next/link";
import { auth } from "@/auth";
import { VendorRegistrationForm } from "@/components/vendor-registration-form";
import { VendorShopDetailsReadonly } from "@/components/vendor-shop-details-readonly";
import { buildCategoryTree } from "@/lib/category-tree";
import { prisma } from "@/lib/prisma";
import { vendorShopfrontLive } from "@/lib/vendor-shopfront-live";

export default async function VendorShopDetailsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    include: {
      shopLocation: true,
      sellingCategories: { include: { category: { select: { id: true, name: true, parentId: true } } } },
    },
  });

  if (!vendor) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">My Shop details</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          No vendor profile yet.{" "}
          <Link href="/register/vendor" className="font-medium text-emerald-800 underline dark:text-emerald-400">
            Register as a vendor
          </Link>
        </p>
      </div>
    );
  }

  const vendorNoteRow = await prisma.$queryRaw<Array<{ correction_notes: string | null }>>`
    SELECT "correction_notes"
    FROM "vendors"
    WHERE "id" = ${vendor.id}
    LIMIT 1
  `;
  const adminCorrectionNote = vendorNoteRow[0]?.correction_notes ?? vendor.correctionNotes ?? null;

  const categoryRows = await prisma.category.findMany({
    select: { id: true, parentId: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });
  const tree = buildCategoryTree(categoryRows);
  const primaryCategories = tree.map((n) => ({ id: n.id, label: n.name }));
  const parentById = new Map(categoryRows.map((c) => [c.id, c.parentId]));
  const primaryCategorySet = new Set(primaryCategories.map((c) => c.id));
  const selectedPrimaryCategoryIds = Array.from(
    new Set(
      vendor.sellingCategories
        .map((s) => {
          let cursor: string | null = s.categoryId;
          while (cursor && !primaryCategorySet.has(cursor)) {
            cursor = parentById.get(cursor) ?? null;
          }
          return cursor;
        })
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const primaryLabels = selectedPrimaryCategoryIds
    .map((id) => primaryCategories.find((p) => p.id === id)?.label)
    .filter((x): x is string => Boolean(x));

  const isLive = vendorShopfrontLive(vendor);
  const canEditShopForm =
    vendor.status === "ON_HOLD" ||
    (vendor.status === "APPROVED" && Boolean(adminCorrectionNote?.trim()) && isLive);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">My Shop details</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          View your shop profile on file with Cleverlocale. For approved shops, editing opens only when your shop is{" "}
          <strong>live</strong> (marketplace open) and a CL Admin requests updates — or while your application is on hold.
        </p>
      </div>

      <VendorShopDetailsReadonly
        shopName={vendor.shopName}
        mobileNumber={vendor.mobileNumber}
        shopDescription={vendor.shopDescription}
        addressLine1={vendor.shopLocation?.addressLine1 ?? null}
        addressLine2={vendor.shopLocation?.addressLine2 ?? null}
        locality={vendor.shopLocation?.locality ?? null}
        city={vendor.shopLocation?.city ?? null}
        pincode={vendor.shopLocation?.pincode ?? null}
        latitude={vendor.shopLocation?.latitude ?? null}
        longitude={vendor.shopLocation?.longitude ?? null}
        categoryLabels={primaryLabels.length ? primaryLabels : vendor.sellingCategories.map((s) => s.category.name)}
      />

      {canEditShopForm ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {vendor.status === "APPROVED" ? "Requested updates" : "Update your application"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {vendor.status === "APPROVED"
              ? "A CL Admin asked for more information. Edit below and submit."
              : "Review the admin note, update your details, and submit for review again."}
          </p>
          <div className="mt-4">
            <VendorRegistrationForm
              primaryCategories={primaryCategories}
              hasSession
              adminCorrectionNotes={adminCorrectionNote}
              initialValues={{
                shopName: vendor.shopName,
                mobileNumber: vendor.mobileNumber,
                shopDescription: vendor.shopDescription,
                addressLine1: vendor.shopLocation?.addressLine1 ?? null,
                addressLine2: vendor.shopLocation?.addressLine2 ?? null,
                locality: vendor.shopLocation?.locality ?? null,
                city: vendor.shopLocation?.city ?? null,
                pincode: vendor.shopLocation?.pincode ?? null,
                latitude: vendor.shopLocation?.latitude ?? null,
                longitude: vendor.shopLocation?.longitude ?? null,
                selectedCategoryIds: selectedPrimaryCategoryIds,
              }}
            />
          </div>
        </section>
      ) : vendor.status === "APPROVED" && Boolean(adminCorrectionNote?.trim()) && !isLive ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          A CL Admin has requested more details, but your shop must be <strong>live</strong> before you can edit and submit.
          Open your shop from the dashboard (and ensure CL Admin has not closed it) — then return here.
        </p>
      ) : vendor.status === "APPROVED" ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No open requests from CL Admin. When they need more details, you’ll be able to edit and submit here once your shop
          is live.
        </p>
      ) : null}
    </div>
  );
}
