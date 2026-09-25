"use client";

export interface ChapterPage {
  id: string;
  page_number: number;
  filepath: string;
  filename: string;
}

export interface ModalChapter {
  id: string;
  title: string;
  total_pages: number;
  pages: ChapterPage[];
}

export interface ThumbnailModalProps {
  selectedChapter: ModalChapter | null;
  onClose: () => void;
}

export function ThumbnailModal({
  selectedChapter,
  onClose,
}: ThumbnailModalProps) {
  if (!selectedChapter) return null;

  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-all duration-200">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-5xl rounded-3xl border border-border/80 bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {selectedChapter.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground/80">
                {selectedChapter.total_pages} pages
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-border/80 bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground shadow-xs"
            >
              Close
            </button>
          </div>

          {/* Grid Content */}
          <div className="max-h-[80vh] overflow-y-auto p-5">
            {selectedChapter.pages.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                No thumbnails available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {selectedChapter.pages.map((page) => {
                  const imageUrl = `${baseUrl}${page.filepath}`;

                  return (
                    <div
                      key={page.id}
                      className="group relative aspect-3/4 overflow-hidden rounded-2xl border border-border/80 bg-muted/40 transition-all duration-200 hover:border-primary/60 hover:shadow-xs"
                    >
                      <span className="absolute left-2 top-2 z-10 rounded-lg border border-black/10 bg-black/65 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                        Page {page.page_number}
                      </span>

                      <img
                        src={imageUrl}
                        alt={page.filename}
                        className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
