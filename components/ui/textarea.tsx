import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[140px] w-full rounded-[1.5rem] border border-slateblue-100 bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-slateblue-400 focus:border-civic-300 focus:ring-2 focus:ring-civic-100",
        className,
      )}
      {...props}
    />
  );
}
