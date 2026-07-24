"use client";

import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { parseNumericDraft } from "../../lib/numeric-input";

type NumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
};

export function NumericInput({
  value,
  onCommit,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  onBlur,
  onKeyDown,
  ...props
}: NumericInputProps) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  function commit() {
    focused.current = false;
    const next = parseNumericDraft(draft, min, max);
    if (next === null) {
      setDraft(String(value));
      return;
    }
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        commit();
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(String(value));
          event.currentTarget.blur();
        }
        onKeyDown?.(event);
      }}
    />
  );
}
