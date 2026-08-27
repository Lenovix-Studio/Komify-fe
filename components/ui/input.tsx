import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        ref={ref}
        className={cn(
          "flex h-10 w-full min-w-0 rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground shadow-xs transition-colors duration-150",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
