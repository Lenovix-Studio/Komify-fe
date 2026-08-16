"use client";

import React from "react";
import { Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({
  text = "Loading...",
  className,
  size = "lg",
}: LoadingProps) {
  const sizeMap = {
    sm: { container: "h-12 w-12", spinner: "h-12 w-12", icon: "h-5 w-5" },
    md: { container: "h-20 w-20", spinner: "h-20 w-20", icon: "h-8 w-8" },
    lg: { container: "h-28 w-28", spinner: "h-28 w-28", icon: "h-11 w-11" },
  };

  return (
    <div
      className={cn(
        "flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 p-4",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center",
          sizeMap[size].container,
        )}
      >
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />

        {/* Big Rotating Spinner */}
        <Loader2
          className={cn(
            "animate-spin text-primary stroke-[1.5]",
            sizeMap[size].spinner,
          )}
        />

        {/* Center Pulsing Icon */}
        <BookOpen
          className={cn(
            "absolute text-primary/80 animate-pulse",
            sizeMap[size].icon,
          )}
        />
      </div>

      {/* Loading Text */}
      {text && (
        <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
