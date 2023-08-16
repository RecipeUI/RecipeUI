"use client";
import { ReactNode } from "react";

export function FormLabelWrapper({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
