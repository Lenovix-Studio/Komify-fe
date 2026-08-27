"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface Comic {
  id: string | number;
  title: string;
  seo_slug?: string | null;
  legacy_id?: number;
  cover_path?: string | null;
  published_at?: string | null;
  total_chapters?: number;
  rating_score?: number;
  rating_count?: number;
  status?: {
    id?: string;
    name?: string;
  } | null;
}

interface ComicCardProps {
  comic: Comic;
  statusStyles?: Record<string, string>;
}

export function ComicCard({ comic, statusStyles = {} }: ComicCardProps) {
  const comicId = comic.seo_slug || comic.id || comic.legacy_id;
  const coverUrl = comic.cover_path
    ? comic.cover_path.startsWith("http")
      ? comic.cover_path
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}${comic.cover_path}`
    : null;

  const statusName = comic.status?.name || "Unknown";

  return (
    <TooltipProvider delay={300}>
      <Link
        href={`/comic/${comicId}`}
        className="group block h-full cursor-pointer"
      >
        <Card className="flex h-full flex-col overflow-hidden border-border/80 bg-card p-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-md">
          <div className="relative aspect-2/3 w-full shrink-0 overflow-hidden bg-muted/40 leading-none">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={comic.title}
                loading="lazy"
                className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted/40 text-xs font-medium text-muted-foreground">
                No Cover
              </div>
            )}

            <div className="absolute left-2 top-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Badge
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider shadow-xs",
                  statusStyles[statusName] ||
                    "bg-secondary text-secondary-foreground border-border/40",
                )}
              >
                {statusName}
              </Badge>
            </div>

            {typeof comic.rating_score === "number" &&
              comic.rating_score > 0 && (
                <div className="absolute right-2 top-2 z-10">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 border border-black/10 bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md shadow-xs"
                  >
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{comic.rating_score.toFixed(1)}</span>
                  </Badge>
                </div>
              )}

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-white">
                  {comic.total_chapters ?? 0} Chapters
                </span>
                {comic.published_at && (
                  <span className="text-[10px] text-zinc-300">
                    Updated {new Date(comic.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex h-12 w-full items-center px-3 py-2">
            <Tooltip>
              <TooltipTrigger className="w-full text-left">
                <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-foreground transition-colors group-hover:text-primary wrap-break-word [word-break:break-word]">
                  {comic.title}
                </h3>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-65 wrap-break-word"
              >
                <p className="text-xs font-normal wrap-break-word">
                  {comic.title}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>
      </Link>
    </TooltipProvider>
  );
}

export function ComicCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/60 bg-card/60 p-0">
      <Skeleton className="aspect-2/3 w-full shrink-0 rounded-none" />
      <div className="flex h-12 items-center px-3 py-2">
        <Skeleton className="h-7 w-full" />
      </div>
    </Card>
  );
}
