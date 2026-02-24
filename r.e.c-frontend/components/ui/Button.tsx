"use client";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
};

export default function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded px-3 py-2 text-sm";
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
  } as const;
  const variants = {
    primary: "bg-black text-white hover:opacity-90",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  } as const;
  const cls = [base, sizes[size], variants[variant], className].join(" ");
  return <button className={cls} {...props} />;
}