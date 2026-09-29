"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { BACKEND_URL } from "@/lib/constant";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Frontend Error Caught:", error);

    const logToBackend = async () => {
      try {
        await fetch(`${BACKEND_URL}/system-logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            level: "ERROR",
            source: "FRONTEND",
            message: error.message || "Unknown Frontend Error",
            stack_trace: error.stack,
            context: {
              digest: error.digest,
              url: window.location.href,
              userAgent: navigator.userAgent,
            },
          }),
        });
      } catch (err) {
        console.error("Failed to send log to backend", err);
      }
    };

    logToBackend();
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Oops, something went wrong!
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          We apologize for the inconvenience. Our technical team has been automatically notified about this issue.
        </p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
          Reload Page
        </Button>
        <Button onClick={() => reset()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
