"use client";

import { cn } from "@/lib/utils";
import { Loading } from "./loading";
import { ReactNode } from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  loadingText?: string;
  variant?: "spinner" | "dots";
  children: ReactNode;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  loadingText,
  variant = "spinner",
  children,
  className,
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <Loading variant={variant} text={loadingText} />
        </div>
      )}
    </div>
  );
}
