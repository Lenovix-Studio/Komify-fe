export type CommonCodeType = {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
};

export type CommonCodeDetail = {
  id: string;
  type_id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};
