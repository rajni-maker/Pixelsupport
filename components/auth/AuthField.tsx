"use client";

/* Labelled input used by both auth screens: leading icon that tints on focus,
 * optional hint line, and an "optional" tag when the field isn't required.
 * Visual states (hover / focus ring / invalid-after-blur) live in `.ps-input`. */
export default function AuthField({
  label,
  name,
  type,
  placeholder,
  icon: Icon,
  required,
  hint,
  autoComplete,
  labelAccessory,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  required?: boolean;
  hint?: string;
  autoComplete?: string;
  /* Rendered at the far right of the label row — e.g. "Forgot password?". */
  labelAccessory?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={name}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[#334155] dark:text-[#CBD5E1]"
        >
          {label}
          {!required && (
            <span className="text-[11px] font-normal text-[#94A3B8]">optional</span>
          )}
        </label>
        {labelAccessory}
      </div>
      <div className="group relative">
        <Icon
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94A3B8] transition-colors group-focus-within:text-[#4F46E5] dark:group-focus-within:text-[#A5B4FC]"
          strokeWidth={1.9}
        />
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="ps-input h-[54px] w-full rounded-xl border border-[#E2E8F0] bg-white pl-[46px] pr-4 text-[15px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] dark:border-[#1E293B] dark:bg-[#111827] dark:text-white dark:placeholder:text-[#64748B]"
        />
      </div>
      {hint && (
        <p className="mt-2 text-[12.5px] text-[#94A3B8] dark:text-[#64748B]">{hint}</p>
      )}
    </div>
  );
}
