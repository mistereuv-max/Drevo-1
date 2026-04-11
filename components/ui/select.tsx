import * as React from "react";
import { cn } from "@/shared/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-xl border border-[#dfd4c2] bg-white px-3 py-1 text-sm outline-none ring-[#c0873d] focus:ring-2",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
