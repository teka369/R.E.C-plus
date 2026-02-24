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
      {label ? <label className="text-sm text-gray-700">{label}</label> : null}
      <select
        className={[
          "rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
          "focus:outline-none focus:ring-2 focus:ring-black",
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