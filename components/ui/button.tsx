import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center cursor-pointer rounded-xl text-sm font-medium transition-all duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 active:bg-destructive/95",
        outline:
          "border border-border/80 bg-card shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:bg-secondary/90",
        ghost:
          "hover:bg-accent/70 hover:text-accent-foreground active:bg-accent",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
        glow: "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/90",
      },
      size: {
        default: "h-9 px-4 py-2 gap-2",
        xs: "h-7 rounded-lg px-2.5 text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-lg px-3 text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 rounded-xl px-5 text-base gap-2 [&_svg:not([class*='size-'])]:size-5",
        xl: "h-11 rounded-2xl px-6 text-base font-semibold gap-2.5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9 rounded-xl",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 rounded-xl [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Pastikan type="button" hanya diterapkan jika elemen aslinya adalah <button>
    // untuk menghindari konflik tipe atribut saat menggunakan `asChild`
    const defaultProps = !asChild ? { type: props.type || "button" } : {};

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...defaultProps}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
