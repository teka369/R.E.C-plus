"use client";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
};

export default function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded px-3 py-2 text-sm";
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
  } as const;
  const variants = {
    primary: "rec-btn-primary",
    secondary: "rec-btn-secondary",
    danger: "rec-btn-danger",
  } as const;
  const cls = [base, sizes[size], variants[variant], className].join(" ");
  return <button type={type} className={cls} {...props} />;
}
