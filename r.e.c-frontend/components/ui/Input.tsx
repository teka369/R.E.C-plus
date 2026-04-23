"use client";
import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm text-rec-text-secondary">{label}</label> : null}
      <input
        className={[
          "rounded border border-rec-border-strong bg-rec-bg-elevated px-3 py-2 text-sm text-rec-text-primary",
          "focus:outline-none focus:ring-2 focus:ring-rec-primary",
          className,
        ].join(" ")}
        {...props}
      />
    </div>
  );
}
