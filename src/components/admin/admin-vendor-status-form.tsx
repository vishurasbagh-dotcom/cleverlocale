"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateVendorRegistrationStatus } from "@/actions/admin-vendors";

type VendorStatus = "PENDING" | "ON_HOLD" | "APPROVED" | "REJECTED" | "SUSPENDED";

export function AdminVendorStatusForm({
  vendorId,
  defaultStatus,
  isApproved,
  initialCorrectionNotes,
}: {
  vendorId: string;
  defaultStatus: VendorStatus;
  isApproved: boolean;
  initialCorrectionNotes: string | null;
}) {
  const isWithVendor = !isApproved && defaultStatus === "ON_HOLD";
  /** Approved vendor: admin already sent a details request; wait for vendor to submit before sending another. */
  const pendingVendorDetailRequest =
    isApproved && (initialCorrectionNotes ?? "").trim().length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [notesOk, setNotesOk] = useState(() => (initialCorrectionNotes ?? "").trim().length > 0);

  const syncFromTextarea = useCallback(() => {
    const v = textareaRef.current?.value ?? "";
    setNotesOk(v.trim().length > 0);
  }, []);

  useEffect(() => {
    syncFromTextarea();
  }, [initialCorrectionNotes, syncFromTextarea]);

  return (
    <form action={updateVendorRegistrationStatus} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="vendorId" value={vendorId} />
      <label className="text-sm text-zinc-600 dark:text-zinc-400">
        <span className="sr-only">Registration status</span>
        <select
          name="status"
          defaultValue={defaultStatus}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <option value="PENDING">Pending review</option>
          <option value="ON_HOLD">On hold</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </label>
      <button
        type="submit"
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Apply
      </button>
      {isApproved ? (
        <button
          type="submit"
          name="requestVendorDetails"
          value="1"
          disabled={pendingVendorDetailRequest || !notesOk}
          title={
            pendingVendorDetailRequest
              ? "A details request is already with the vendor. This unlocks after they submit."
              : notesOk
                ? undefined
                : "Add request notes first"
          }
          className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-100 dark:hover:bg-violet-950/50"
        >
          Request vendor details
        </button>
      ) : (
        <button
          type="submit"
          name="sendBackToVendor"
          value="1"
          disabled={isWithVendor || !notesOk}
          title={
            isWithVendor
              ? "Already sent back. Waiting for vendor resubmission."
              : notesOk
                ? undefined
                : "Add correction notes before sending back"
          }
          className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-100 dark:hover:bg-sky-950/50"
        >
          Send back to vendor
        </button>
      )}
      {!isWithVendor ? (
        <label className="w-full text-sm text-zinc-600 dark:text-zinc-400">
          <span className="mb-1 block">
            {isApproved
              ? "Request notes (required for Request vendor details)"
              : "Correction notes (required for On hold)"}
          </span>
          <textarea
            ref={textareaRef}
            name="correctionNotes"
            defaultValue={initialCorrectionNotes ?? ""}
            readOnly={isApproved && pendingVendorDetailRequest}
            rows={2}
            onInput={syncFromTextarea}
            onChange={syncFromTextarea}
            placeholder={
              isApproved
                ? "Describe what additional information you need from the vendor."
                : "Tell the vendor exactly what to correct before resubmission."
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm read-only:bg-zinc-50 read-only:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-950 dark:read-only:bg-zinc-900 dark:read-only:text-zinc-400"
          />
        </label>
      ) : (
        <p className="w-full text-xs text-zinc-500 dark:text-zinc-400">
          Form is currently with vendor for correction. Notes and send-back controls will reappear after resubmission.
        </p>
      )}
    </form>
  );
}
