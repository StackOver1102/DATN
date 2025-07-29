"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { Progress } from "./progress";
import { LoadingSpinner } from "./loading-spinner";
import { ReactNode } from "react";

interface LoadingProps {
  variant?: "spinner" | "skeleton" | "progress" | "dots";
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Loading({
  variant = "spinner",
  size = "md",
  text,
  fullScreen = false,
  className,
  children,
}: LoadingProps) {
  // Nếu fullScreen, bọc trong một div fixed để hiển thị giữa màn hình
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3",
            className
          )}
        >
          {renderLoadingIndicator(variant, size)}
          {text && (
            <p
              className={cn(
                "text-center text-muted-foreground",
                size === "sm"
                  ? "text-xs"
                  : size === "md"
                  ? "text-sm"
                  : "text-base"
              )}
            >
              {text}
            </p>
          )}
          {children}
        </div>
      </div>
    );
  }

  // Hiển thị thông thường
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      {renderLoadingIndicator(variant, size)}
      {text && (
        <p
          className={cn(
            "text-center text-muted-foreground",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
          )}
        >
          {text}
        </p>
      )}
      {children}
    </div>
  );
}

function renderLoadingIndicator(
  variant: LoadingProps["variant"],
  size: LoadingProps["size"] = "md"
) {
  switch (variant) {
    case "spinner":
      return (
        <LoadingSpinner
          size={size}
          className={cn(
            "border-gray-300",
            size === "sm" ? "border-2" : size === "md" ? "border-3" : "border-4"
          )}
        />
      );
    case "skeleton":
      return (
        <div className="space-y-2">
          <Skeleton className={cn("h-4 w-[250px]", size === "lg" && "h-6")} />
          <Skeleton className={cn("h-4 w-[200px]", size === "lg" && "h-6")} />
          {size === "lg" && <Skeleton className="h-6 w-[170px]" />}
        </div>
      );
    case "progress":
      return <Progress value={66} className="w-[250px]" />;
    case "dots":
      return (
        <div className="flex space-x-2">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className={cn(
                "rounded-full bg-gray-400 animate-bounce",
                size === "sm"
                  ? "h-2 w-2"
                  : size === "md"
                  ? "h-3 w-3"
                  : "h-4 w-4"
              )}
              style={{
                animationDelay: `${dot * 0.1}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
      );
    default:
      return <LoadingSpinner size={size} />;
  }
}
