export type ComicMetadata = {
  id: string;
  title: string;
  alternative_title: string | null;
  description: string | null;
  legacy_id: number;
  cover_path: string | null;
  total_chapters: number;

  status: {
    id: string;
    name: string;
  };

  category: {
    id: string;
    name: string;
    slug: string;
  };

  tags: {
    id: string;
    name: string;
    slug: string;
  }[];

  parodies: {
    id: string;
    name: string;
    slug: string;
  }[];

  characters: {
    id: string;
    name: string;
    slug: string;
  }[];

  artists: {
    id: string;
    name: string;
    slug: string;
  }[];

  authors: {
    id: string;
    name: string;
    slug: string;
  }[];

  groups: {
    id: string;
    name: string;
    slug: string;
  }[];

  created_at: string;
  updated_at: string;
};

export type ComicChaptersResponse = {
  data: ComicChapter[];
  comic_id: string;
  total_chapters: number;
};

export type ComicChapter = {
  id: string;
  title: string;
  chapter_number: string;
  total_pages: number;
  published_at: string;

  language: {
    code: string;
    name: string;
  };

  censorship: {
    id: string;
    name: string;
  };

  pages: {
    id: string;
    filename: string;
    filepath: string;
    page_number: number;
  }[];
};
