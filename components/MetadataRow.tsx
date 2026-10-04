"use client";

import { useState } from "react";
import Link from "next/link";
import { MetadataType } from "@/lib/constant";

export const metadataQueryMap: Record<string, string> = {
  parody: "parodies",
  character: "characters",
  author: "authors",
  artist: "artists",
  group: "groups",
  tag: "tags",
};

export const metadataStyles: Record<string, string> = {
  parody: "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  character: "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  author: "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  artist: "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  group: "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
  tag: "border-slate-200 bg-slate-100/80 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700",
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

  const queryKey = metadataQueryMap[item.type] || item.type;

  return (
    <div
      className={`grid items-start gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[110px_1fr] ${!isLast ? "border-b border-border/50" : ""
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
            href={`/?${queryKey}=${encodeURIComponent(
              value.slug || value.name,
            )}`}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${metadataStyles[item.type] || ""
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
