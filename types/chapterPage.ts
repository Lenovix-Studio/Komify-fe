export type ChapterPage = {
  id: string;
  page: number;
  file: File;
  previewUrl: string;
  filename?: string;
  filepath?: string;
  page_number?: number;
  width?: number | null;
  height?: number | null;
  filesize?: number | null;
  created_at?: string;
};

export type Language = {
  code: string;
  name: string;
};

export type Censorship = {
  id: string;
  name: string;
};

export type ChapterListResponse = {
  data: {
    id: string;
    title: string;
    chapter_number: string;

    language: {
      code: string;
      name: string;
    };

    censorship: {
      id: string;
      name: string;
    };

    total_pages: number;
    published_at: string | null;
  }[];

  comic_id: string;
  total_chapters: number;
};

export type ChapterDetail = {
  id: string;

  comic: {
    id: string;
    title: string;
    legacy_id: number;
  };

  title: string;
  chapter_number: string;
  total_pages: number;

  published_at: string | null;

  language: {
    code: string;
    name: string;
  };

  censorship: {
    id: string;
    name: string;
  };

  pages: ChapterPage[];
};

export type ChapterResponse = {
  comic: {
    id: string;
    title: string;
    seo_slug: string | null;
    legacy_id: number;
    cover_path: string | null;
    alternative_title: string | null;
  };

  pages: ChapterPage[];

  chapter: {
    id: string;
    title: string;
    chapter_number: string;

    language: {
      code: string;
      name: string;
    };

    censorship: {
      id: string;
      name: string;
    };

    created_at: string;
    updated_at: string;
    total_pages: number;
    published_at: string;
  };

  navigation: {
    next_chapter: string | null;
    prev_chapter: string | null;
  };
};

export type EditablePage = {
  id: string;
  page: number;
  filename?: string;
  url?: string;
  file?: File;
  isExisting?: boolean;
  isReplaced?: boolean;
};
