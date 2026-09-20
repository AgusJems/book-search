import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import type { Book, BookSearchResult } from '../models/book.model';
import type {
  OpenLibraryBookDocument,
  OpenLibrarySearchResponse,
} from '../models/open-library.model';

@Injectable({ providedIn: 'root' })
export class BookSearchService {
  private readonly http = inject(HttpClient);
  private readonly searchUrl = 'https://openlibrary.org/search.json';

  search(query: string, page = 1): Observable<BookSearchResult> {
    const params = new HttpParams()
      .set('q', query)
      .set('fields', 'key,title,author_name,first_publish_year,cover_i')
      .set('limit', 20)
      .set('page', page);

    return this.http.get<OpenLibrarySearchResponse>(this.searchUrl, { params }).pipe(
      map((response) => ({
        books: response.docs.map((book) => this.mapBook(book)),
        total: response.numFound,
      })),
    );
  }

  private mapBook(document: OpenLibraryBookDocument): Book {
    return {
      id: document.key,
      title: document.title,
      authors: document.author_name ?? [],
      firstPublishYear: document.first_publish_year ?? null,
      coverId: document.cover_i ?? null,
    };
  }
}
