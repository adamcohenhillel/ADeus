import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cnHelper";

// Define variants for the switch
const switchVariants = cva(
  "relative inline-flex items-center cursor-pointer", // Base styles
  {
    variants: {
      size: {
        sm: "w-14 h-8",
        md: "w-16 h-9",
        lg: "w-20 h-10",
      },
      color: {
        default: "bg-background",
        active: "bg-accent",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
    compoundVariants: [
      {
        size: "sm",
        color: "active",
        class: "bg-accent",
      },
      {
        size: "md",
        color: "active",
        class: "bg-accent",
      },
      {
        size: "lg",
        color: "active",
        class: "bg-accent",
      },
    ],
  }
);

// SwitchProps interface, extending for any additional props you might need
export interface SwitchProps extends VariantProps<typeof switchVariants> {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    size: "sm" | "md" | "lg"; // Do not allow 'null' here
  }
  

// The Switch component
const Switch: React.FC<SwitchProps> = ({
    checked,
    onChange,
    label,
    size,
    ...props
  }) => {
    // Improved click handling by attaching the onClick event to the container
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      // Prevent the default input change event to properly handle the toggle action
      event.preventDefault();
      onChange(!checked);
    };

    const validSizes = ['sm', 'md', 'lg'] as const; // Define valid sizes as a tuple of readonly strings
    type Size = typeof validSizes[number]; // Create a Size type based on validSizes

  
    // Define the size of the toggle based on the provided size prop
    const toggleSize = {
      sm: { width: 'w-6', height: 'h-6', translate: 'translate-x-6' },
      md: { width: 'w-7', height: 'h-7', translate: 'translate-x-7' },
      lg: { width: 'w-8', height: 'h-8', translate: 'translate-x-9' },
    };

    const getSizeConfig = (size: Size) => {
        // This function ensures that the size key is valid
        return toggleSize[size];
      };
  
    const sizeConfig = getSizeConfig(size); // Use the function to get the size config

    return (
      <label className="flex items-center cursor-pointer">
        {label && <span className="mr-2 text-md">{label}</span>}
        <div
          className={cn(
            "relative inline-flex items-center transition-colors duration-300 ease-in-out",
            checked ? "bg-green-500" : "bg-gray-200",
            size === "sm" ? "w-12 h-6" : "",
            size === "md" ? "w-14 h-7" : "",
            size === "lg" ? "w-16 h-8" : ""
          )}
          style={{ borderRadius: '9999px' }} // Fully rounded ends
          onClick={handleClick}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            readOnly
          />
          <span
          className={cn(
          "block bg-white shadow-lg transform transition-transform duration-300 ease-in-out",
          sizeConfig.width,
          sizeConfig.height,
          checked ? sizeConfig.translate : "translate-x-0"
          )}
            style={{ borderRadius: '9999px' }} // Fully rounded knob
          />
        </div>
      </label>
    );
  };

export { Switch };
