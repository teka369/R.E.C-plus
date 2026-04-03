"use client";
import React from "react";

type Props = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
};

export default function FormField({ label, error, hint, required, children }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
