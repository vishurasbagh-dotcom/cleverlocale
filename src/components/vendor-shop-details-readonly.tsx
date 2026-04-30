export function VendorShopDetailsReadonly({
  shopName,
  mobileNumber,
  shopDescription,
  addressLine1,
  addressLine2,
  locality,
  city,
  pincode,
  latitude,
  longitude,
  categoryLabels,
}: {
  shopName: string;
  mobileNumber: string | null;
  shopDescription: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  locality: string | null;
  city: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  categoryLabels: string[];
}) {
  return (
    <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Details of my shop</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This is what Cleverlocale has on file. You can edit only when a CL Admin asks for updates.
      </p>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="font-medium text-zinc-500">Shop name</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{shopName}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Mobile</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {mobileNumber ? `+91 ${mobileNumber}` : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-zinc-500">About your business</dt>
          <dd className="mt-1 text-zinc-800 dark:text-zinc-200">{shopDescription?.trim() || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-zinc-500">Primary categories</dt>
          <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
            {categoryLabels.length ? categoryLabels.join(", ") : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-zinc-500">Address</dt>
          <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
            {[addressLine1, addressLine2, locality, city, pincode].filter(Boolean).join(", ") || "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-zinc-500">Map location</dt>
          <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
            {latitude != null && longitude != null
              ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              : "Not set"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
