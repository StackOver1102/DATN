import { cn } from "@/lib/utils";
import { Loading } from "./loading";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  text = "Đang tải...",
  variant = "spinner",
  className,
  children,
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loading size="lg" variant={variant} text={text} />
      </div>
    </div>
  );
}

// Full Screen Loading Overlay
export function FullScreenLoading({
  isLoading,
  text = "Đang tải...",
  variant = "spinner",
}: {
  isLoading: boolean;
  text?: string;
  variant?: "spinner" | "dots" | "pulse";
}) {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Loading size="xl" variant={variant} text={text} />
    </div>
  );
}

// Modal Loading Overlay
export function ModalLoadingOverlay({
  isLoading,
  text = "Đang xử lý...",
}: {
  isLoading: boolean;
  text?: string;
}) {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
      <Loading size="md" variant="spinner" text={text} />
    </div>
  );
}

// Button Loading State
export function ButtonLoadingState({
  isLoading,
  loadingText = "Đang xử lý...",
  children,
  className,
  ...props
}: {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {isLoading && <Loading size="sm" variant="spinner" />}
      {isLoading ? loadingText : children}
    </button>
  );
}
