"use client";

import { useState } from "react";
import { Loading } from "./ui/loading";
import { LoadingButton } from "./ui/loading-button";
import { LoadingOverlay } from "./ui/loading-overlay";
import { Button } from "./ui/button";

export default function LoadingDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOverlayLoading, setIsOverlayLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const simulateOverlayLoading = () => {
    setIsOverlayLoading(true);
    setTimeout(() => setIsOverlayLoading(false), 3000);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Loading Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border p-4 rounded-lg flex flex-col items-center justify-center h-40">
            <h3 className="font-medium mb-4">Spinner</h3>
            <Loading variant="spinner" text="Loading..." />
          </div>

          <div className="border p-4 rounded-lg flex flex-col items-center justify-center h-40">
            <h3 className="font-medium mb-4">Dots</h3>
            <Loading variant="dots" text="Loading..." />
          </div>

          <div className="border p-4 rounded-lg flex flex-col items-center justify-center h-40">
            <h3 className="font-medium mb-4">Progress</h3>
            <Loading variant="progress" text="Loading..." />
          </div>

          <div className="border p-4 rounded-lg flex flex-col items-center justify-center h-40">
            <h3 className="font-medium mb-4">Skeleton</h3>
            <Loading variant="skeleton" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Loading Button</h2>
        <div className="flex flex-wrap gap-4">
          <LoadingButton
            isLoading={isLoading}
            loadingText="Loading..."
            onClick={simulateLoading}
          >
            Default Button
          </LoadingButton>

          <LoadingButton
            variant="secondary"
            isLoading={isLoading}
            loadingText="Saving..."
            onClick={simulateLoading}
          >
            Secondary Button
          </LoadingButton>

          <LoadingButton
            variant="destructive"
            isLoading={isLoading}
            onClick={simulateLoading}
          >
            Destructive Button
          </LoadingButton>

          <LoadingButton
            variant="outline"
            isLoading={isLoading}
            loadingText="Processing..."
            onClick={simulateLoading}
          >
            Outline Button
          </LoadingButton>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Loading Overlay</h2>
        <LoadingOverlay
          isLoading={isOverlayLoading}
          loadingText="Loading content..."
        >
          <div className="border p-6 rounded-lg">
            <h3 className="font-medium mb-4">Content with Overlay</h3>
            <p className="mb-4">
              This content will be covered by a loading overlay when the button
              is clicked.
            </p>
            <Button onClick={simulateOverlayLoading}>
              Show Loading Overlay
            </Button>
          </div>
        </LoadingOverlay>
      </div>
    </div>
  );
}
