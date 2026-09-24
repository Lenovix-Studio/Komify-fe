export type BookmarkComic = {
  id: string;
  title: string;
  seo_slug: string | null;
  cover_path: string | null;
  alternative_title: string | null;
  category_id: string | null;
};

export type BookmarkItem = {
  comic_id: string;
  created_at: string;
  comics: BookmarkComic;
};
