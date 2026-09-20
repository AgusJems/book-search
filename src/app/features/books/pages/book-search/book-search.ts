import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
  tap,
  type Observable,
} from 'rxjs';

import type { Book } from '../../models/book.model';
import { BookSearchService } from '../../services/book-search.service';
import { BookCardComponent } from '../../components/book-card/book-card';
import { BookDetailDialogComponent } from '../../components/book-detail-dialog/book-detail-dialog';

type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly books: readonly Book[]; readonly total: number }
  | { readonly status: 'error'; readonly message: string };

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [ReactiveFormsModule, BookCardComponent, BookDetailDialogComponent],
  templateUrl: './book-search.html',
  styleUrl: './book-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookSearchComponent {
  private readonly bookSearchService = inject(BookSearchService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly minQueryLength = 3;
  protected readonly searchState = signal<SearchState>({ status: 'idle' });
  protected readonly selectedBook = signal<Book | null>(null);
  protected readonly loadingMore = signal(false);
  private readonly currentQuery = signal('');
  private readonly currentPage = signal(1);
  protected readonly activeQuery = this.currentQuery.asReadonly();
  protected readonly hasMore = computed(() => {
    const state = this.searchState();
    return state.status === 'success' && state.books.length < state.total;
  });
  constructor() {
    this.searchControl.valueChanges
      .pipe(
        map((query) => query.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        tap((query) => this.resetSearch(query)),
        switchMap((query) => this.search(query)),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.searchState.set(state));
  }

  protected selectBook(book: Book): void {
    this.selectedBook.set(book);
  }

  protected closeBookDetail(): void {
    this.selectedBook.set(null);
  }

  protected loadMore(): void {
    const state = this.searchState();
    if (state.status !== 'success' || !this.hasMore() || this.loadingMore()) {
      return;
    }

    const nextPage = this.currentPage() + 1;
    const query = this.currentQuery();
    this.loadingMore.set(true);

    this.bookSearchService
      .search(query, nextPage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (this.currentQuery() !== query) {
            return;
          }

          this.currentPage.set(nextPage);
          this.searchState.set({
            status: 'success',
            books: [...state.books, ...result.books],
            total: result.total,
          });
          this.loadingMore.set(false);
        },
        error: () => {
          if (this.currentQuery() === query) {
            this.loadingMore.set(false);
          }
        },
      });
  }

  protected retrySearch(): void {
    const query = this.currentQuery();

    if (!query) {
      return;
    }

    this.search(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (this.currentQuery() === query) {
          this.searchState.set(state);
        }
      });
  }

  private search(query: string): Observable<SearchState> {
    if (query.length < this.minQueryLength) {
      return of<SearchState>({ status: 'idle' });
    }

    this.selectedBook.set(null);
    return this.bookSearchService.search(query).pipe(
      map((result): SearchState => ({
        status: 'success',
        books: result.books,
        total: result.total,
      })),
      startWith<SearchState>({ status: 'loading' }),
      catchError(() =>
        of<SearchState>({
          status: 'error',
          message: "Couldn't reach Open Library. Try again in a moment.",
        }),
      ),
    );
  }

  private resetSearch(query: string): void {
    this.currentQuery.set(query);
    this.currentPage.set(1);
    this.selectedBook.set(null);
    this.loadingMore.set(false);
    this.searchState.set({ status: 'idle' });
  }
}
