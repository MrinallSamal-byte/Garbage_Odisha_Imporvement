import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-slateblue-100 bg-white pl-4 pr-10 text-sm text-ink shadow-sm outline-none transition focus:border-civic-300 focus:ring-2 focus:ring-civic-100",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
