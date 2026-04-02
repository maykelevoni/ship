export declare const allDocs: Doc[];
export declare const allGuides: Guide[];
export declare const allPosts: Post[];
export declare const allPages: Page[];

export type Doc = {
  _id: string;
  _raw: any;
  type: string;
  title: string;
  description?: string;
  published?: boolean;
  slug: string;
  slugAsParams: string;
  body: { raw: string; code: string };
  [key: string]: any;
};

export type Guide = {
  _id: string;
  _raw: any;
  type: string;
  title: string;
  description?: string;
  published?: boolean;
  slug: string;
  slugAsParams: string;
  body: { raw: string; code: string };
  [key: string]: any;
};

export type Post = {
  _id: string;
  _raw: any;
  type: string;
  title: string;
  description?: string;
  date?: string;
  published?: boolean;
  image?: string;
  authors: string[];
  categories: string[];
  slug: string;
  slugAsParams: string;
  body: { raw: string; code: string };
  [key: string]: any;
};

export type Page = {
  _id: string;
  _raw: any;
  type: string;
  title: string;
  description?: string;
  slug: string;
  slugAsParams: string;
  body: { raw: string; code: string };
  [key: string]: any;
};
