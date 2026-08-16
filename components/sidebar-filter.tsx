"use client";

import { Filter, RotateCcw, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

interface SidebarFilterProps {
  activeFilterCount: number;
  resetFilters: () => void;
  categories: FilterOption[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  statuses: string[];
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  sortOptions: FilterOption[];
  sort: string;
  setSort: (value: string) => void;
  tags: string[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  tagSearch: string;
  setTagSearch: (value: string) => void;
  className?: string;
}

export function SidebarFilter({
  activeFilterCount,
  resetFilters,
  categories,
  selectedCategory,
  setSelectedCategory,
  statuses,
  selectedStatus,
  setSelectedStatus,
  sortOptions,
  sort,
  setSort,
  tags,
  selectedTags,
  toggleTag,
  tagSearch,
  setTagSearch,
  className,
}: SidebarFilterProps) {
  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  return (
    <aside
      className={cn(
        "h-fit rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm lg:sticky lg:top-24",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="h-5 min-w-5 justify-center rounded-full p-0 text-[10px] font-bold"
            >
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            title="Reset filters"
            className="group h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-180" />
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-muted-foreground">
          Categories
        </h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => {
            const isSelected = selectedCategory === item.value;
            return (
              <Button
                key={item.value}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedCategory(isSelected ? "" : item.value)
                }
                className={cn(
                  "h-auto rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                  !isSelected &&
                    "border-border/60 bg-background/50 text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-muted-foreground">
          Status
        </h4>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <Button
                key={status}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(isSelected ? "" : status)}
                className={cn(
                  "h-auto rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                  !isSelected &&
                    "border-border/60 bg-background/50 text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {status}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-muted-foreground">
          Sort By
        </h4>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((item) => {
            const isSelected = sort === item.value;
            return (
              <Button
                key={item.value}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSort(item.value)}
                className={cn(
                  "h-auto rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                  !isSelected &&
                    "border-border/60 bg-background/50 text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tags Filter */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
          <div className="relative w-32">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Search..."
              className="h-7 w-full rounded-lg border-border/60 bg-background/50 pl-7 pr-2 text-xs focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                onClick={() => toggleTag(tag)}
                className="cursor-pointer rounded-xl px-2.5 py-1 text-xs font-medium gap-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                {tag}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}

        {/* Available Tags */}
        <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {filteredTags
            .filter((tag) => !selectedTags.includes(tag))
            .map((tag) => (
              <Button
                key={tag}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleTag(tag)}
                className="h-auto rounded-xl border-border/60 bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-all"
              >
                {tag}
              </Button>
            ))}
        </div>
      </div>
    </aside>
  );
}
