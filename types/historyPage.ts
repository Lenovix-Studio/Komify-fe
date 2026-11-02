export type HistoryComic = {
  id: string;
  title: string;
  seo_slug: string | null;
  cover_path: string | null;
  alternative_title: string | null;
  categories?: {
    id: string;
    name: string;
  } | null;
};

export type HistoryChapter = {
  id: string;
  chapter_number: string;
  title: string | null;
  total_pages: number;
};

export type HistoryItem = {
  id: string;
  comic_id: string;
  chapter_id: string;
  last_page: number;
  created_at: string;
  updated_at: string;
  comics: HistoryComic;
  chapters: HistoryChapter;
};
