import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent active:ring-2 active:ring-accent/40 active:border-accent disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-white",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground data-[state=on]:border-accent data-[state=on]:bg-accent data-[state=on]:text-white",
      },
      size: {
        default: "h-9 px-3 min-w-16",
        sm: "h-8 px-2.5 min-w-14",
        lg: "h-10 px-4 min-w-20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ToggleProps = Omit<React.ComponentProps<"button">, "onChange"> &
  VariantProps<typeof toggleVariants> & {
    pressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
  };

function Toggle({
  className,
  variant,
  size,
  pressed = false,
  onPressedChange,
  onClick,
  type = "button",
  ...props
}: ToggleProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      data-state={pressed ? "on" : "off"}
      className={cn(toggleVariants({ variant, size, className }))}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        onPressedChange?.(!pressed);
      }}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
