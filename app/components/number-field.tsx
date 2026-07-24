"use client";

import { NumericInput } from "./numeric-input";

export function NumberField({
  label,
  value,
  unit,
  icon,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  icon?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="stat-field">
      <span className="stat-label">
        {icon ? <span className="stat-icon">{icon}</span> : null}
        {label}
        {unit ? <span className="field-kind">{unit}</span> : null}
      </span>
      <span className="number-wrap">
        <NumericInput
          aria-label={label}
          value={value}
          min={0}
          max={10_000_000}
          onCommit={onChange}
        />
        {unit ? <span className="unit">{unit}</span> : null}
      </span>
    </label>
  );
}
