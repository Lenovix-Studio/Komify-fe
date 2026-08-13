"use client";

import {
  Bookmark,
  Upload,
  Settings,
  Search,
  BookOpenText,
  Filter,
  RotateCcw,
  Dices,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

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
    limit: 10,
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
    params.set("limit", "10");

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
  const categories = [
    { label: "Manga", value: "manga" },
    { label: "Manhwa", value: "manhwa" },
    { label: "Manhua", value: "manhua" },
  ];
  const tags = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
  ];
  const statuses = ["Ongoing", "Completed", "Hiatus"];
  const sortOptions = [
    {
      label: "Latest",
      value: "latest",
    },
    {
      label: "Newest",
      value: "newest",
    },
    {
      label: "Popular",
      value: "popular",
    },
    {
      label: "A-Z",
      value: "title",
    },
  ];
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
    );
    setPage(1);
  };
  const activeFilterCount =
    Number(!!selectedCategory) +
    Number(!!selectedStatus) +
    Number(!!selectedLanguage) +
    selectedTags.length +
    selectedParodies.length +
    selectedCharacters.length +
    selectedAuthors.length +
    selectedArtists.length +
    selectedGroups.length;
  const resetFilters = () => {
    window.history.replaceState(null, "", "/");
    setSearch("");
    setSearchInput("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSelectedLanguage("");
    setSelectedTags([]);
    setSelectedParodies([]);
    setSelectedCharacters([]);
    setSelectedAuthors([]);
    setSelectedArtists([]);
    setSelectedGroups([]);
    setTagSearch("");
    setSort("latest");
    setPage(1);
  };

  const [tagSearch, setTagSearch] = useState("");
  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase()),
  );

  const handleRandomComic = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/comics/random`,
      );
      if (!response.ok) {
        throw new Error("Failed");
      }

      const comic = await response.json();
      router.push(`/comic/${comic.seo_slug ?? comic.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to load random comic");
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  /* ================= PAGINATION ================= */
  const visiblePages = useMemo(() => {
    const total = pagination.total_pages;

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (page <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (page >= total - 2) {
      return [total - 4, total - 3, total - 2, total - 1, total];
    }

    return [page - 2, page - 1, page, page + 1, page + 2];
  }, [page, pagination.total_pages]);

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <Header
        searchValue={searchInput}
        onSearchChange={(val) => setSearchInput(val)}
        onSearchClear={handleClearSearch}
        onRandomClick={handleRandomComic}
        rightContent={
          <>
            <Button
              variant="ghost"
              asChild
              className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link href="/bookmark">
                <Bookmark className="h-4 w-4" />
                <span className="hidden md:inline">Bookmark</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              asChild
              className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link href="/upload">
                <Upload className="h-4 w-4" />
                <span className="hidden md:inline">Upload</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              asChild
              className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Settings</span>
              </Link>
            </Button>
          </>
        }
      />

      {/* Latest Updates */}
      <section className="mx-auto max-w-337.5 px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Sidebar Filter */}
          <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 lg:sticky lg:top-24">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-indigo-400" />
                <h3 className="font-semibold">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  title="Reset filters"
                  className="group flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4 transition group-hover:-rotate-180" />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium text-zinc-300">
                Categories
              </h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item.value}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === item.value ? "" : item.value,
                      )
                    }
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      selectedCategory === item.value
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-indigo-500 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium text-zinc-300">Status</h4>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setSelectedStatus(selectedStatus === status ? "" : status)
                    }
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      selectedStatus === status
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-indigo-500 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium text-zinc-300">
                Sort By
              </h4>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSort(item.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      sort === item.value
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-indigo-500 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-zinc-300">Tags</h4>
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-32 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none transition focus:border-indigo-500"
                />
              </div>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="rounded-xl border border-indigo-500 bg-indigo-500 px-3 py-2 text-xs font-medium text-white"
                    >
                      {tag} ✕
                    </button>
                  ))}
                </div>
              )}

              {/* Available Tags */}
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                {filteredTags
                  .filter((tag) => !selectedTags.includes(tag))
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-indigo-500 hover:text-white"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          </aside>

          {/* Comic Grid */}
          <div>
            {/* Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {loading
                ? Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2"
                    >
                      <div className="aspect-2/3 rounded-2xl bg-zinc-800" />
                      <div className="mt-3 h-4 rounded bg-zinc-800" />
                      <div className="mt-2 h-4 w-2/3 rounded bg-zinc-800" />
                    </div>
                  ))
                : comics.map((comic) => {
                    return (
                      <Link
                        key={comic.id}
                        href={`/comic/${comic.id || comic.legacy_id}`}
                        className="group block cursor-pointer"
                      >
                        {/* Cover */}
                        <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-zinc-900 transition duration-300 group-hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20">
                          {/* Cover Image */}
                          {comic.cover_path ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${comic.cover_path}`}
                              alt={comic.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-zinc-800" />
                          )}
                          <div className="absolute left-2 top-2 flex flex-wrap gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                            {/* Status */}
                            <div
                              className={`rounded-lg px-2 py-1 text-[10px] font-semibold text-center uppercase tracking-wider ${
                                statusStyles[comic.status?.name] ||
                                "bg-zinc-500 text-white"
                              }`}
                            >
                              {comic.status?.name || "Unknown"}
                            </div>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold text-white">
                                  {comic.total_chapters} Chapters
                                </p>

                                <p className="mt-1 text-[10px] text-zinc-300">
                                  Updated{" "}
                                  {new Date(
                                    comic.published_at,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="mt-3">
                          <div className="relative">
                            <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-zinc-100 transition group-hover:text-white">
                              {comic.title}
                            </h3>

                            {/* Hover Tooltip */}
                            <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-max max-w-65 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs leading-5 text-white opacity-0 shadow-2xl transition duration-200 group-hover:opacity-100">
                              {comic.title}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
            </div>

            {/* Empty */}
            {!loading && comics.length === 0 && (
              <div className="flex h-80 items-center justify-center">
                <p className="text-sm text-zinc-500">No comics available.</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.total_data > 10 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                {/* Prev */}
                <button
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition hover:border-indigo-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>

                {/* First Page */}
                {!visiblePages.includes(1) && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-400 transition hover:border-indigo-500 hover:text-white"
                    >
                      1
                    </button>

                    <span className="px-1 text-zinc-500">...</span>
                  </>
                )}

                {/* Pages */}
                {visiblePages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-10 min-w-10 rounded-xl px-4 text-sm font-semibold transition ${
                      page === p
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-indigo-500 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {/* Last Page */}
                {!visiblePages.includes(pagination.total_pages) &&
                  pagination.total_pages > 1 && (
                    <>
                      <span className="px-1 text-zinc-500">...</span>

                      <button
                        onClick={() => setPage(pagination.total_pages)}
                        className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-400 transition hover:border-indigo-500 hover:text-white"
                      >
                        {pagination.total_pages}
                      </button>
                    </>
                  )}

                {/* Next */}
                <button
                  disabled={!pagination.has_next}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, pagination.total_pages),
                    )
                  }
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition hover:border-indigo-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
