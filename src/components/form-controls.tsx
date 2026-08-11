"use client";

import { CircleHelp } from "lucide-react";
import { useId, useState } from "react";
import { formatYen } from "@/lib/format";

interface MoneyFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  help?: string;
  hint?: string;
  disabled?: boolean;
}

export function MoneyField({
  label,
  value,
  onChange,
  help,
  hint,
  disabled = false,
}: MoneyFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className="field">
      <div className="field-label-row">
        <label htmlFor={id}>{label}</label>
        {help ? <HelpButton text={help} /> : null}
      </div>
      <div className="money-input-wrap">
        <input
          id={id}
          className="money-input"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          aria-describedby={hint ? helpId : undefined}
          disabled={disabled}
        />
        <span aria-hidden="true">円</span>
      </div>
      <div className="field-meta" id={helpId}>
        <span className="numeric">{formatYen(value)}</span>
        {hint ? <span>{hint}</span> : null}
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  help?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  suffix,
  help,
}: NumberFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-label-row">
        <label htmlFor={id}>{label}</label>
        {help ? <HelpButton text={help} /> : null}
      </div>
      <div className="money-input-wrap">
        <input
          id={id}
          className="money-input"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value) || min;
            onChange(Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, next)));
          }}
        />
        {suffix ? <span aria-hidden="true">{suffix}</span> : null}
      </div>
    </div>
  );
}

export function HelpButton({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="help-control">
      <button
        type="button"
        className="help-button"
        aria-label="説明を表示"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
      >
        <CircleHelp size={16} aria-hidden="true" />
      </button>
      {open ? (
        <span className="help-popover" id={id} role="note">
          {text}
        </span>
      ) : null}
    </span>
  );
}

interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="segmented-field">
      <legend>{label}</legend>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={value === option.value ? "is-selected" : undefined}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            disabled={option.disabled}
          >
            <span>{option.label}</span>
            {option.description ? <small>{option.description}</small> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <label className="toggle-row" htmlFor={id}>
      <span>
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className={`switch ${checked ? "is-on" : ""}`}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span aria-hidden="true" />
      </span>
    </label>
  );
}
