import { Dialog } from "@headlessui/react";
import classNames from "classnames";
import { ReactNode, useEffect, useRef } from "react";

export function Modal({
  header,
  headerClassName,
  description,
  children,
  size = "md",
  onClose,
  autoFocus,
}: {
  header: string;
  headerClassName?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  autoFocus?: boolean;
  onClose?: () => void;
}) {
  return (
    <Dialog
      open={true}
      onClose={() => {
        onClose?.();
      }}
      className="relative z-50"
      autoFocus={false}
      data-no-dnd="true"
    >
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel
          className={classNames(
            "bg-base-100 p-8 rounded-lg relative",
            size === "sm" && "w-[400px]",
            size === "md" && "w-[600px]",
            size === "lg" && "w-[800px]",
            "max-h-[700px] overflow-y-auto"
          )}
        >
          <Dialog.Title
            className={classNames(
              "text-2xl font-bold outline-none",
              headerClassName
            )}
            tabIndex={autoFocus ? undefined : -1}
          >
            {header}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="pb-4">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
