"use client";
import { ReactNode } from "react";

export function FormFieldWrapper({
  children,
  label,
  description,
}: {
  children: ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <div>
      <label className="mb-2 text-sm font-bold block">{label}</label>
      {description && <p className="text-sm mb-2">{description}</p>}
      {children}
    </div>
  );
}
