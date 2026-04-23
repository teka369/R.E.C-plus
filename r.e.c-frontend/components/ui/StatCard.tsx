"use client";
import React, { type ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; direction: "up" | "down" };
};

export default function StatCard({ label, value, icon, trend }: Props) {
  return (
    <div className="sec-stat">
      <div className="flex items-center justify-between">
        <p className="label">{label}</p>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      <p className="value">{value}</p>
      {trend && (
        <p
          className={`mt-1 text-xs font-semibold ${
            trend.direction === "up" ? "text-rec-success-text" : "text-rec-danger-text"
          }`}
        >
          {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
        </p>
      )}
    </div>
  );
}
