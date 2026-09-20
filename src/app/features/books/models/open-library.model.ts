export interface OpenLibraryBookDocument {
  readonly key: string;
  readonly title: string;
  readonly author_name?: readonly string[];
  readonly first_publish_year?: number;
  readonly cover_i?: number;
}

export interface OpenLibrarySearchResponse {
  readonly numFound: number;
  readonly docs: readonly OpenLibraryBookDocument[];
}
