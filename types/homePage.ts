export type Comic = {
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

export type HomepageResponse = {
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
