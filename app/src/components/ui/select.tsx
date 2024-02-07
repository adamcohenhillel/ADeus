import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cnHelper";

const selectVariants = cva(
  "block w-full rounded-md border border-input bg-background text-base font-medium shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50",
  {
    variants: {
      size: {
        default: "py-2 px-4",
        sm: "py-1.5 px-3 text-sm",
        lg: "py-2.5 px-5 text-lg",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  asChild?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "select";
    return (
      <Comp
        className={cn(selectVariants({ size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";

export { Select, selectVariants };
