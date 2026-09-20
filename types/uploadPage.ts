export type Status = {
  id: string;
  name: string;
};
export type Censorship = {
  id: string;
  name: string;
};
export type Language = {
  code: string;
  name: string;
};
export type Chapter = {
  id: string;
  main: number;
  sub: number;
  title: string;
  censorship_id: string;
  language: string;
  pages: string[];
};

export type TempPage = {
  id: string;
  url: string;
  name: string;
};
