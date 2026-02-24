"use client";
import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm text-gray-700">{label}</label> : null}
      <input
        className={[
          "rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
          "focus:outline-none focus:ring-2 focus:ring-black",
          className,
        ].join(" ")}
        {...props}
      />
    </div>
  );
}