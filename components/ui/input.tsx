import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-slateblue-100 bg-white px-4 text-sm text-ink shadow-sm outline-none transition placeholder:text-slateblue-400 focus:border-civic-300 focus:ring-2 focus:ring-civic-100",
        className,
      )}
      {...props}
    />
  );
}
