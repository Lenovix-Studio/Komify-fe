"use client";

import { useState } from "react";
import Link from "next/link";

export type MetadataType = "author" | "genre" | "tag" | string;

export const metadataQueryMap: Record<string, string> = {
  genre: "genre",
  author: "author",
};

export const metadataStyles: Record<string, string> = {
  genre: "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10",
  author: "bg-muted text-muted-foreground border-border hover:bg-accent",
};

export interface MetadataRowProps {
  item: {
    label: string;
    type: MetadataType;
    values: Array<{ id: string | number; name: string; slug?: string }>;
  };
  isLast: boolean;
}

export function MetadataRow({ item, isLast }: MetadataRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_LIMIT = 15;
  const hasMore = item.values.length > INITIAL_LIMIT;

  const displayedValues = isExpanded
    ? item.values
    : item.values.slice(0, INITIAL_LIMIT);

  return (
    <div
      className={`grid items-start gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[110px_1fr] ${
        !isLast ? "border-b border-border/50" : ""
      }`}
    >
      <div className="pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {item.label}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {displayedValues.map((value) => (
          <Link
            key={value.id}
            href={`/?${metadataQueryMap[item.type]}=${encodeURIComponent(
              value.slug || value.name,
            )}`}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              metadataStyles[item.type] || ""
            }`}
          >
            {value.name}
          </Link>
        ))}

        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg border border-dashed border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-muted hover:text-primary/80"
          >
            {isExpanded
              ? "Show Less"
              : `+${item.values.length - INITIAL_LIMIT} more`}
          </button>
        )}
      </div>
    </div>
  );
}
