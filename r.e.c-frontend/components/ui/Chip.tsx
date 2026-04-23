"use client";
import React from "react";

type Props = {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
};

const variantClasses: Record<NonNullable<Props["variant"]>, string> = {
  default: "",
  success: "text-rec-success-text border-rec-success-border bg-rec-success-bg",
  warning: "text-rec-warning-text border-rec-warning-border bg-rec-warning-bg",
  danger: "text-rec-danger-text border-rec-danger-border bg-rec-danger-bg",
};

export default function Chip({ children, variant = "default" }: Props) {
  const extra = variantClasses[variant];
  return (
    <span className={`sec-chip ${extra}`}>
      {children}
    </span>
  );
}
