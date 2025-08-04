import { cn } from "@/lib/utils";
import { IconLoader2 } from "@tabler/icons-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
  text?: string;
}

export function Loading({
  size = "md",
  variant = "spinner",
  className,
  text,
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <IconLoader2
          className={cn("animate-spin text-primary", sizeClasses[size])}
        />
        {text && (
          <span className={cn("text-muted-foreground", textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-1", className)}>
        <div className="flex gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
        </div>
        {text && (
          <span className={cn("ml-2 text-muted-foreground", textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div
          className={cn(
            "animate-pulse rounded-full bg-primary",
            sizeClasses[size]
          )}
        />
        {text && (
          <span className={cn("text-muted-foreground", textSizes[size])}>
            {text}
          </span>
        )}
      </div>
    );
  }

  return null;
}

// Page Loading Component
export function PageLoading({ text = "Đang tải..." }: { text?: string }) {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
}

// Card Loading Component
export function CardLoading() {
  return (
    <div className="rounded-lg border p-6">
      <div className="space-y-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
      </div>
    </div>
  );
}

// Table Loading Component
export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-4 w-4 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-1/6 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-1/6 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-1/6 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
        </div>
      ))}
    </div>
  );
}

// Button Loading Component
export function ButtonLoading({
  size = "md",
  variant = "default",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "destructive";
}) {
  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-11 px-8",
  };

  return (
    <button
      disabled
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        {
          "bg-primary text-primary-foreground hover:bg-primary/90":
            variant === "default",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground":
            variant === "outline",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90":
            variant === "destructive",
        }
      )}
    >
      <Loading size="sm" variant="spinner" />
      Đang xử lý...
    </button>
  );
}

// Skeleton Loading Component
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="space-y-3">
        <Skeleton className="h-48 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    </div>
  );
}

// Form Loading Component
export function FormLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
