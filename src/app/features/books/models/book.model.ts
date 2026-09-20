export interface Book {
  readonly id: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly firstPublishYear: number | null;
  readonly coverId: number | null;
}

export interface BookSearchResult {
  readonly books: readonly Book[];
  readonly total: number;
}
