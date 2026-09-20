"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpenText, Search, X, Dices, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
  onRandomClick?: () => void;
  isRandomLoading?: boolean;
  logo?: boolean;
  showSearch?: boolean;
  showRandom?: boolean;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function Header({
  searchValue = "",
  onSearchChange,
  onSearchClear,
  onRandomClick,
  isRandomLoading = false,
  logo = true,
  showSearch = true,
  showRandom = true,
  leftContent,
  centerContent,
  rightContent,
}: HeaderProps) {
  const [internalSearch, setInternalSearch] = useState(searchValue);

  useEffect(() => {
    setInternalSearch(searchValue);
  }, [searchValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalSearch(val);
    onSearchChange?.(val);
  };

  const handleClear = () => {
    setInternalSearch("");
    onSearchClear ? onSearchClear() : onSearchChange?.("");
  };

  const hasDefaultCenter = showSearch || showRandom;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md shadow-xs transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-3 shrink-0 flex-1 justify-start">
          {logo && (
            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-85 shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <BookOpenText className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline-block">
                Komify
              </span>
            </Link>
          )}
          {leftContent}
        </div>

        <div className="flex items-center justify-center flex-1 max-w-md w-full">
          {centerContent ? (
            centerContent
          ) : hasDefaultCenter ? (
            <div className="flex items-center gap-2 w-full">
              {showRandom && (
                <Button
                  title="Random Comic"
                  variant="outline"
                  onClick={onRandomClick}
                  disabled={isRandomLoading}
                  className="gap-2 rounded-xl border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors shrink-0 hidden md:flex disabled:opacity-50"
                >
                  {isRandomLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Dices className="h-4 w-4" />
                  )}
                </Button>
              )}
              {showSearch && (
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={internalSearch}
                    onChange={handleInputChange}
                    placeholder="Search comics..."
                    className="pl-9 pr-9 h-10 rounded-xl bg-card border-border/80 focus-visible:bg-background focus-visible:ring-primary/30 shadow-xs transition-all placeholder:text-muted-foreground/70"
                  />
                  {internalSearch && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleClear}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-1 justify-end">
          <nav className="flex items-center gap-2">{rightContent}</nav>
        </div>
      </div>
    </header>
  );
}
