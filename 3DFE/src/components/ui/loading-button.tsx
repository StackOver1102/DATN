"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Button } from "./button";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button";

export interface LoadingButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  spinnerClassName?: string;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      spinnerClassName,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        className={className}
        variant={variant}
        size={size}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner
              size="sm"
              className={cn("mr-2", spinnerClassName)}
            />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
