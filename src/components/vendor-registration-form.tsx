"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  submitVendorApplication,
  type VendorApplicationState,
} from "@/actions/vendor-application";
import { VendorLocationPicker } from "@/components/vendor-location-picker";

export function VendorRegistrationForm({
  primaryCategories,
  hasSession,
  mode = "public",
  onSuccess,
  onCancel,
  adminCorrectionNotes = null,
  initialValues,
}: {
  primaryCategories: { id: string; label: string }[];
  /** Signed-in customer completing application (no business email section). */
  hasSession: boolean;
  mode?: "public" | "admin";
  onSuccess?: () => void;
  onCancel?: () => void;
  adminCorrectionNotes?: string | null;
  initialValues?: {
    shopName?: string | null;
    mobileNumber?: string | null;
    shopDescription?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    locality?: string | null;
    city?: string | null;
    pincode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    selectedCategoryIds?: string[];
  };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitVendorApplication, {} as VendorApplicationState);
  const [lat, setLat] = useState(
    initialValues?.latitude !== null && initialValues?.latitude !== undefined ? String(initialValues.latitude) : "",
  );
  const [lng, setLng] = useState(
    initialValues?.longitude !== null && initialValues?.longitude !== undefined ? String(initialValues.longitude) : "",
  );
  const isAdminMode = mode === "admin";
  const applicationMode = isAdminMode ? "guest" : hasSession ? "linked" : "guest";

  useEffect(() => {
    const nextLat =
      initialValues?.latitude !== null && initialValues?.latitude !== undefined ? String(initialValues.latitude) : "";
    const nextLng =
      initialValues?.longitude !== null && initialValues?.longitude !== undefined ? String(initialValues.longitude) : "";
    setLat(nextLat);
    setLng(nextLng);
  }, [initialValues?.latitude, initialValues?.longitude]);

  useEffect(() => {
    if (!state.success) return;
    if (isAdminMode) {
      router.refresh();
      onSuccess?.();
      return;
    }
    const ms = hasSession ? 1600 : 2200;
    const url = hasSession ? "/vendor/shop" : "/login?registered=vendor&callbackUrl=%2Fvendor%2Fshop";
    const t = setTimeout(() => router.push(url), ms);
    return () => clearTimeout(t);
  }, [state.success, router, hasSession, isAdminMode, onSuccess]);

  const guestNote = !hasSession && !isAdminMode ? (
    <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
      No account needed beforehand — create your <strong>business login</strong> below. After submit, sign in with that email to
      track approval (<strong>Approved</strong>, <strong>On hold</strong>, or <strong>Rejected</strong>).
    </p>
  ) : null;

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="applicationMode" value={applicationMode} readOnly />
      {!isAdminMode && hasSession && adminCorrectionNotes ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <strong>Correction requested by CL Admin:</strong> {adminCorrectionNotes}
        </p>
      ) : null}

      {guestNote}

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-100">
          {isAdminMode
            ? "Vendor application created successfully."
            : `${state.success} ${hasSession ? "Redirecting to your vendor dashboard…" : "Redirecting to sign in…"}`}
        </p>
      )}
      {!hasSession && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {isAdminMode ? "Vendor account credentials" : "Business login"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Use a dedicated email for this shop. These credentials will be used by the vendor to sign in.
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Business email</span>
              <input
                name="businessEmail"
                type="email"
                required
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Password (min 8 characters)</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Confirm password</span>
              <input
                name="passwordConfirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Your name (optional)</span>
              <input
                name="contactName"
                type="text"
                autoComplete="name"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Shop details</h2>
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Vendor / shop name</span>
            <input
              name="shopName"
              required
              defaultValue={initialValues?.shopName ?? ""}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="As it should appear to customers when approved"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Vendor mobile number</span>
            <div className="mt-1.5 flex max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-950">
              <span className="inline-flex items-center border-r border-zinc-200 px-3 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                +91
              </span>
              <input
                name="mobileNumber"
                required
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                defaultValue={initialValues?.mobileNumber ?? ""}
                className="w-full bg-transparent px-3 py-2.5 outline-none"
                placeholder="10 digit mobile number"
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">About your business (optional)</span>
            <textarea
              name="shopDescription"
              rows={4}
              defaultValue={initialValues?.shopDescription ?? ""}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Tell Cleverlocale admins about what you sell and your experience."
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Primary categories you sell</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Select the main departments your shop belongs to. Subcategories will be available when you add products after
          approval.
        </p>
        <div className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          {primaryCategories.length === 0 ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              No primary categories exist yet. Ask a CL Admin to set up categories first.
            </p>
          ) : (
            primaryCategories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={Boolean(initialValues?.selectedCategoryIds?.includes(c.id))}
                  className="mt-1 rounded border-zinc-400"
                />
                <span>{c.label}</span>
              </label>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Address</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Address line 1</span>
            <input
              name="addressLine1"
              required
              defaultValue={initialValues?.addressLine1 ?? ""}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Address line 2 (optional)</span>
            <input
              name="addressLine2"
              defaultValue={initialValues?.addressLine2 ?? ""}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Area / locality</span>
            <input
              name="locality"
              required
              defaultValue={initialValues?.locality ?? ""}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">City / town</span>
            <input
              name="city"
              required
              defaultValue={initialValues?.city ?? ""}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Pincode</span>
            <input
              name="pincode"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              defaultValue={initialValues?.pincode ?? ""}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="6 digits"
            />
          </label>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Location on map (optional)</h3>
          <input type="hidden" name="latitude" value={lat} readOnly />
          <input type="hidden" name="longitude" value={lng} readOnly />
          <div className="mt-2">
            <VendorLocationPicker
              latitude={lat}
              longitude={lng}
              onLatLngChange={(la, ln) => {
                setLat(la);
                setLng(ln);
              }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Certificate (optional)</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Upload a registration certificate, GST proof, or trade licence (image, PDF, or Word). Only Cleverlocale admins
          can access this file — it is never shown on the public storefront.
        </p>
        <input
          type="file"
          name="certificate"
          accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="mt-3 block w-full max-w-lg text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-900 dark:text-zinc-400 dark:file:bg-emerald-900/40 dark:file:text-emerald-100"
        />
        <p className="mt-2 text-xs text-zinc-500">Maximum size 12 MB.</p>
      </section>

      <div className={`flex ${isAdminMode ? "justify-end gap-3" : ""}`}>
        {isAdminMode ? (
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending || primaryCategories.length === 0}
          className={`${isAdminMode ? "" : "w-full "}rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500`}
        >
          {pending ? "Submitting…" : isAdminMode ? "Submit" : "Submit application for review"}
        </button>
      </div>
    </form>
  );
}
