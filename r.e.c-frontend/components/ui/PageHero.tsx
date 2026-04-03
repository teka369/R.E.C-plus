"use client";
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  chips?: string[];
  actions?: React.ReactNode;
};

export default function PageHero({ title, subtitle, chips, actions }: Props) {
  return (
    <div className="sec-hero">
      <div>
        <h1 className="sec-title">{title}</h1>
        {subtitle && <p className="sec-subtitle">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {chips?.map((chip) => (
          <span key={chip} className="sec-chip">{chip}</span>
        ))}
        {actions}
      </div>
    </div>
  );
}
