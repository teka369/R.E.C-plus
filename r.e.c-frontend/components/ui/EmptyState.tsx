"use client";
import React from "react";
import { FiInbox } from "react-icons/fi";

type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-rec-muted mb-4">
        {icon ?? <FiInbox size={48} />}
      </div>
      <h3 className="text-lg font-semibold text-rec-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-rec-muted max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
