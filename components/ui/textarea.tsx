import * as React from "react";
import { cn } from "@/shared/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[90px] w-full rounded-xl border border-[#dfd4c2] bg-white px-3 py-2 text-sm outline-none ring-[#c0873d] placeholder:text-[#9a9388] focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}
