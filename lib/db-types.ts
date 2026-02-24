/** Row from public.links */
export type LinkRow = {
  id: string;
  url: string;
  domain: string | null;
  title: string | null;
  summary: string | null;
  description: string | null;
  read_time_minutes: number | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

/** Insert payload (id optional, created_at/read_at optional) */
export type LinkInsert = Omit<LinkRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
  read_at?: string | null;
};

/** Update payload (partial) */
export type LinkUpdate = Partial<
  Pick<
    LinkRow,
    "domain" | "title" | "summary" | "description" | "read_time_minutes" | "is_read" | "read_at"
  >
>;
