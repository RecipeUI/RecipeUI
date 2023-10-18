import { Cog6ToothIcon, SparklesIcon } from "@heroicons/react/24/outline";

export function EditorActionWrapper({
  label,
  onClick,
  hideAction,
  children,
}: {
  label: string;
  onClick: () => void;
  hideAction?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1">
      {children}
      {!hideAction && (
        <button
          className="absolute border rounded-md  bottom-3 right-6 py-1 px-2 flex items-center justify-center space-x-1 text-sm group/action bg-base-200 shadow-md"
          onClick={onClick}
        >
          <Cog6ToothIcon className="inline w-4 h-4 group-hover/action:animate-spin" />
          <span>{label}</span>
        </button>
      )}
    </div>
  );
}
