"use client";

import { Bookmark, Upload, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { PaginationControl } from "@/components/pagination";
import { ComicCard, ComicCardSkeleton } from "@/components/comic-card";

type Comic = {
  id: string;
  title: string;
  seo_slug: string | null;
  legacy_id: number;
  cover_path: string | null;
  published_at: string;
  total_chapters: number;
  rating_score: number;
  rating_count: number;
  status: {
    id: string;
    name: string;
  };
};

type HomepageResponse = {
  data: Comic[];
  pagination: {
    page: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
    total_data: number;
    total_pages: number;
  };
};

const statusStyles: Record<string, string> = {
  Completed: "bg-emerald-500 text-white",
  Ongoing: "bg-sky-500 text-white",
  "Not Completed": "bg-rose-500 text-white",
  Unknown: "bg-zinc-500 text-white",
};

export default function HomePage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [comics, setComics] = useState<Comic[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    has_next: false,
    has_prev: false,
    total_data: 0,
    total_pages: 1,
  });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [sort, setSort] = useState("latest");
  const [searchInput, setSearchInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedParodies, setSelectedParodies] = useState<string[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedParodies(
      params.get("parodies")?.split(",").filter(Boolean) ?? [],
    );
    setSelectedCharacters(
      params.get("characters")?.split(",").filter(Boolean) ?? [],
    );
    setSelectedAuthors(params.get("authors")?.split(",").filter(Boolean) ?? []);
    setSelectedArtists(params.get("artists")?.split(",").filter(Boolean) ?? []);
    setSelectedGroups(params.get("groups")?.split(",").filter(Boolean) ?? []);
    setSelectedTags(params.get("tags")?.split(",").filter(Boolean) ?? []);
    setInitialized(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", "12");

    if (search) params.set("q", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedLanguage) params.set("language", selectedLanguage);
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    if (selectedParodies.length)
      params.set("parodies", selectedParodies.join(","));
    if (selectedCharacters.length)
      params.set("characters", selectedCharacters.join(","));
    if (selectedAuthors.length)
      params.set("authors", selectedAuthors.join(","));
    if (selectedArtists.length)
      params.set("artists", selectedArtists.join(","));
    if (selectedGroups.length) params.set("groups", selectedGroups.join(","));
    if (sort) params.set("sort", sort);
    return params.toString();
  };
  const fetchComics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/comics?${buildQuery()}`,
        { cache: "no-store" },
      );
      const result: HomepageResponse = await response.json();
      setComics(result.data);
      setPagination(result.pagination);
    } finally {
      setLoading(false);
    }
  };

  const fetchComicsSilent = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/comics?${buildQuery()}`,
        { cache: "no-store" },
      );
      if (response.ok) {
        const result: HomepageResponse = await response.json();
        setComics(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Failed to auto-update comics:", error);
    }
  };
  useEffect(() => {
    if (!initialized) return;

    fetchComics();
  }, [
    initialized,
    page,
    search,
    selectedCategory,
    selectedStatus,
    selectedLanguage,
    selectedTags,
    selectedParodies,
    selectedCharacters,
    selectedAuthors,
    selectedArtists,
    selectedGroups,
    sort,
  ]);

  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(() => {
      fetchComicsSilent();
    }, 5000);
    return () => clearInterval(interval);
  }, [
    initialized,
    page,
    search,
    selectedCategory,
    selectedStatus,
    selectedLanguage,
    selectedTags,
    selectedParodies,
    selectedCharacters,
    selectedAuthors,
    selectedArtists,
    selectedGroups,
    sort,
  ]);

  const handleRandomComic = async () => {
    if (isRandomLoading) return;

    setIsRandomLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/comics/random`,
      );
      if (!response.ok) {
        throw new Error("Failed");
      }

      const comic = await response.json();
      const targetSlug = comic?.seo_slug ?? comic?.id;
      if (targetSlug) {
        router.push(`/comic/${targetSlug}`);
      } else {
        console.warn("Random comic returned empty payload:", comic);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load random comic");
    } finally {
      setIsRandomLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Header
        searchValue={searchInput}
        onSearchChange={(val) => setSearchInput(val)}
        onSearchClear={handleClearSearch}
        onRandomClick={handleRandomComic}
        isRandomLoading={isRandomLoading}
        rightContent={
          <>
            <Button
              variant="ghost"
              asChild
              className="gap-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Link href="/bookmark">
                <Bookmark className="h-4 w-4 text-muted-foreground/80" />
                <span className="hidden md:inline">Bookmark</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              asChild
              className="gap-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Link href="/upload">
                <Upload className="h-4 w-4 text-muted-foreground/80" />
                <span className="hidden md:inline">Upload</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              asChild
              className="gap-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 text-muted-foreground/80" />
                <span className="hidden md:inline">Settings</span>
              </Link>
            </Button>
          </>
        }
      />

      <section className="mx-auto flex flex-1 w-full max-w-7xl flex-col">
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {comics.length > 0 || loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {loading
                ? Array.from({ length: 12 }).map((_, index) => (
                    <ComicCardSkeleton key={index} />
                  ))
                : comics.map((comic) => (
                    <ComicCard
                      key={comic.id}
                      comic={comic}
                      statusStyles={statusStyles}
                    />
                  ))}
            </div>
          ) : null}

          {!loading && comics.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center shadow-xs">
              <div className="mb-3 rounded-full bg-accent/60 p-4">
                <svg
                  className="h-8 w-8 text-muted-foreground/80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Tidak Ada Komik
              </h3>
              <p className="mt-1 text-sm text-muted-foreground/80">
                Belum ada data komik yang tersedia saat ini.
              </p>
            </div>
          )}
        </div>

        {!loading && pagination.total_data > 12 && (
          <div className="shrink-0 border-t border-border/40 bg-background/95 py-3 backdrop-blur-md">
            <PaginationControl
              currentPage={page}
              totalPages={pagination.total_pages}
              onPageChange={(newPage) => setPage(newPage)}
              hasNext={pagination.has_next}
              hasPrev={page > 1}
            />
          </div>
        )}
      </section>
    </main>
  );
}
