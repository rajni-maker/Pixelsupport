"use client";

/* Labelled input for the dark screens: uppercase label, leading icon that
 * tints on focus, optional hint, and an "optional" tag when not required.
 * Visual states live in `.psd-input` (see dark.css). */
export default function DarkField({
  label,
  name,
  type,
  placeholder,
  icon: Icon,
  required,
  hint,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  required?: boolean;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#a0a0b8]"
      >
        {label}
        {!required && (
          <span className="text-[11px] font-normal text-[#4a4a6a]">optional</span>
        )}
      </label>
      <div className="group relative">
        <Icon
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#4a4a6a] transition-colors group-focus-within:text-[#a78bfa]"
          strokeWidth={1.9}
        />
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="psd-input h-[46px] w-full rounded-xl border border-white/[0.06] bg-[#11112a] pl-[46px] pr-4 text-sm text-[#f0f0f5] outline-none placeholder:text-[#4a4a6a]"
        />
      </div>
      {hint && <p className="mt-2 text-xs text-[#4a4a6a]">{hint}</p>}
    </div>
  );
}
