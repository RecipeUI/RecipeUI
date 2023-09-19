"use client";
import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

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
      <label className="mb-2 text-sm font-bold block capitalize">{label}</label>
      {description && (
        <ReactMarkdown
          className="text-sm mb-2"
          components={{
            a: (props) => (
              <a
                {...props}
                className="text-blue-600 underline"
                target="_blank"
              />
            ),
          }}
        >
          {description}
        </ReactMarkdown>
      )}
      {children}
    </div>
  );
}
