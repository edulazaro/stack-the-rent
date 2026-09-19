import type { ReactElement, ReactNode } from "react";

export interface HelpItem {
  chip: string;
  chipClass: string;
  text: string;
}

/** Dark layer over the canvas for in-game screens. Scrolls when the stage is small. */
export function MenuLayer({ children, dim = "bg-black/75" }: { children: ReactNode; dim?: string }): ReactElement {
  return (
    <div className={`absolute inset-0 z-30 touch-pan-y overflow-y-auto ${dim}`}>
      <div className="flex min-h-full flex-col items-center justify-center gap-2 px-6 py-6 text-center text-white">
        {children}
      </div>
    </div>
  );
}

export function MenuTitle({ title, subtitle }: { title: string; subtitle?: string }): ReactElement {
  return (
    <div className="mb-2">
      <p className="font-mono text-3xl font-bold tracking-tight">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-300">{subtitle}</p>}
    </div>
  );
}

export function MenuButton({
  onClick,
  primary = false,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-56 border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
        primary
          ? "border-white bg-white text-black hover:bg-gray-200"
          : "border-white/60 text-white hover:bg-white hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

export function HelpList({ items }: { items: HelpItem[] }): ReactElement {
  return (
    <div className="grid max-w-2xl gap-3 text-left text-xs text-gray-300 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.chip} className="flex gap-2">
          <span className={`shrink-0 self-start px-2 py-0.5 text-[10px] font-bold ${item.chipClass}`}>{item.chip}</span>
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}
