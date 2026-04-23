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
        {required && <span className="ml-0.5 text-rec-danger-text">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-rec-text-subtle">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-rec-danger-text">{error}</p>
      )}
    </div>
  );
}
