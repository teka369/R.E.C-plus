"use client";
import React from "react";

type Props = {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
};

const variantClasses: Record<NonNullable<Props["variant"]>, string> = {
  default: "",
  success: "text-green-700 border-green-300 bg-green-50",
  warning: "text-amber-700 border-amber-300 bg-amber-50",
  danger: "text-red-700 border-red-300 bg-red-50",
};

export default function Chip({ children, variant = "default" }: Props) {
  const extra = variantClasses[variant];
  return (
    <span className={`sec-chip ${extra}`}>
      {children}
    </span>
  );
}
