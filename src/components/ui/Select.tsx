interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: (Option | string)[];
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  className,
}: SelectProps) {
  return (
    <label
      className={`flex flex-col gap-1 text-xs text-sub ${className ?? ""}`}
    >
      {label && <span className="font-medium">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-primary"
      >
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lab = typeof o === "string" ? o : o.label;
          return (
            <option key={val} value={val}>
              {lab}
            </option>
          );
        })}
      </select>
    </label>
  );
}
