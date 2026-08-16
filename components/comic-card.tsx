"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <Link href={`/comic/${comicId}`} className="group block cursor-pointer">
        <Card className="overflow-hidden border-border/60 bg-card/50 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
          <CardContent className="p-0">
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={comic.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                  No Cover
                </div>
              )}

              <div className="absolute left-2 top-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Badge
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider shadow-sm",
                    statusStyles[statusName] ||
                      "bg-secondary text-secondary-foreground",
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
                      className="flex items-center gap-1 border border-border/40 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-md"
                    >
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{comic.rating_score.toFixed(1)}</span>
                    </Badge>
                  </div>
                )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    {comic.total_chapters ?? 0} Chapters
                  </span>
                  {comic.published_at && (
                    <span className="text-[10px] text-muted-foreground">
                      Updated{" "}
                      {new Date(comic.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3">
              <Tooltip>
                <TooltipTrigger>
                  <h3 className="line-clamp-2 text-sm font-medium leading-5 text-card-foreground transition-colors group-hover:text-primary">
                    {comic.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px]">
                  <p className="text-xs font-normal">{comic.title}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </Link>
    </TooltipProvider>
  );
}

export function ComicCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/40 bg-card/40">
      <CardContent className="p-0">
        <Skeleton className="aspect-[2/3] w-full rounded-none" />
        <div className="space-y-2 p-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}
