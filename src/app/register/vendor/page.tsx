import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { VendorRegistrationForm } from "@/components/vendor-registration-form";
import { buildCategoryTree } from "@/lib/category-tree";
import { prisma } from "@/lib/prisma";

export default async function RegisterVendorPage() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  const currentVendor = session?.user?.id
    ? await prisma.vendor.findUnique({
        where: { userId: session.user.id },
        select: {
          status: true,
          correctionNotes: true,
          shopName: true,
          mobileNumber: true,
          shopDescription: true,
          addressLine1: true,
          addressLine2: true,
          locality: true,
          city: true,
          pincode: true,
          latitude: true,
          longitude: true,
          sellingCategories: { select: { categoryId: true } },
        },
      })
    : null;
  const vendorNoteRow = currentVendor
    ? await prisma.$queryRaw<Array<{ correction_notes: string | null }>>`
        SELECT "correction_notes"
        FROM "vendors"
        WHERE "user_id" = ${session?.user?.id ?? ""}
        LIMIT 1
      `
    : [];
  const adminCorrectionNote = vendorNoteRow[0]?.correction_notes ?? currentVendor?.correctionNotes ?? null;
  if (currentVendor?.status === "APPROVED") {
    redirect("/vendor");
  }

  const rows = await prisma.category.findMany({
    select: { id: true, parentId: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });
  const tree = buildCategoryTree(rows);
  const primaryCategories = tree.map((n) => ({ id: n.id, label: n.name }));
  const parentById = new Map(rows.map((c) => [c.id, c.parentId]));
  const primaryCategorySet = new Set(primaryCategories.map((c) => c.id));
  const selectedPrimaryCategoryIds = currentVendor
    ? Array.from(
        new Set(
          currentVendor.sellingCategories
            .map((s) => {
              let cursor: string | null = s.categoryId;
              while (cursor && !primaryCategorySet.has(cursor)) {
                cursor = parentById.get(cursor) ?? null;
              }
              return cursor;
            })
            .filter((id): id is string => Boolean(id)),
        ),
      )
    : [];

  const hasSession = Boolean(session?.user);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Sell on Cleverlocale
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vendor application
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Submit your shop for review. Cleverlocale admins set your registration to <strong>Approved</strong>,{" "}
          <strong>On hold</strong>, or <strong>Rejected</strong>. Only approved shops can appear on the marketplace (and you
          can temporarily hide yours with a switch after approval).
        </p>
      </div>

      <VendorRegistrationForm
        primaryCategories={primaryCategories}
        hasSession={hasSession}
        adminCorrectionNotes={adminCorrectionNote}
        initialValues={
          currentVendor
            ? {
                shopName: currentVendor.shopName,
                mobileNumber: currentVendor.mobileNumber,
                shopDescription: currentVendor.shopDescription,
                addressLine1: currentVendor.addressLine1,
                addressLine2: currentVendor.addressLine2,
                locality: currentVendor.locality,
                city: currentVendor.city,
                pincode: currentVendor.pincode,
                latitude: currentVendor.latitude,
                longitude: currentVendor.longitude,
                selectedCategoryIds: selectedPrimaryCategoryIds,
              }
            : undefined
        }
      />

      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/" className="text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-400">
          ← Back to Homepage
        </Link>
      </p>
    </div>
  );
}
