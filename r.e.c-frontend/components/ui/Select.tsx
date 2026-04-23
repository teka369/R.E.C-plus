"use client";
import React from "react";

type Option = { label: string; value: string };

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Option[];
};

export default function Select({ label, options, className = "", ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm text-rec-text-secondary">{label}</label> : null}
      <select
        className={[
          "rounded border border-rec-border-strong bg-rec-bg-elevated px-3 py-2 text-sm text-rec-text-primary",
          "focus:outline-none focus:ring-2 focus:ring-rec-primary",
          className,
        ].join(" ")}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}