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

export type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MetadataResponse = {
  title?: string;
  alternative_title?: string;
  parodies?: string[];
  characters?: string[];
  artists?: string[];
  groups?: string[];
  tags?: string[];
};

export type ActionResult = {
  success: boolean;
  data?: MetadataResponse;
  message?: string;
};

export type OptionItem = {
  id?: string;
  code?: string;
  name: string;
};

export const fields = [
  { key: "title", label: "Title", placeholder: "Comic Title", required: true },
  { key: "parodies", label: "Parodies", placeholder: "Solo Leveling, Naruto" },
  {
    key: "characters",
    label: "Characters",
    placeholder: "Sung Jin-Woo, Naruto Uzumaki",
  },
  { key: "artists", label: "Artists", placeholder: "Redice Studio" },
  { key: "authors", label: "Authors", placeholder: "Chugong" },
  { key: "groups", label: "Groups", placeholder: "Scanlation Team" },
  { key: "tags", label: "Tags", placeholder: "Action, Fantasy, Adventure" },
];
