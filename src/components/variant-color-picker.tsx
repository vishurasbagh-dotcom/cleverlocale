"use client";

import { VARIANT_COLOR_PRESETS } from "@/lib/variant-color-presets";

type Props = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
};

/** Preset chips + native color input + clear — for Label 1 / Label 2 columns on each variant row. */
export function VariantColorPicker({ label, value, onChange }: Props) {
  const active = /^#[0-9A-Fa-f]{6}$/.test(value);
  const pickerValue = active ? value : "#888888";

  return (
    <div className="space-y-1">
      <span className="sr-only">{label} display color</span>
      <div className="flex flex-wrap items-center gap-1">
        {VARIANT_COLOR_PRESETS.map((hex) => (
          <button
            key={hex}
            type="button"
            title={`${hex}`}
            onClick={() => onChange(hex)}
            className={`h-6 w-6 shrink-0 rounded-full border shadow-sm transition ring-offset-2 ring-offset-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:ring-offset-zinc-950 ${
              value === hex ? "ring-2 ring-emerald-600" : "border-zinc-300 dark:border-zinc-600"
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
        <label
          className="relative ml-0.5 flex h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-full border border-dashed border-zinc-400 dark:border-zinc-500"
          title="Custom color"
        >
          <span className="sr-only">Custom {label}</span>
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-[180%] w-[180%] min-w-0 cursor-pointer -translate-x-[20%] -translate-y-[20%] border-0 p-0"
          />
        </label>
        <button
          type="button"
          onClick={() => onChange("")}
          className="ml-1 text-[11px] font-medium text-zinc-500 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Clear
        </button>
      </div>
      {active ? (
        <p className="text-[10px] font-mono text-zinc-500">{value}</p>
      ) : (
        <p className="text-[10px] text-zinc-400">Optional swatch for storefront</p>
      )}
    </div>
  );
}
