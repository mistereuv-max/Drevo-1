import * as React from "react";
import { cn } from "@/shared/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-[#dfd4c2] bg-white px-3 py-1 text-sm outline-none ring-[#c0873d] placeholder:text-[#9a9388] focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}
