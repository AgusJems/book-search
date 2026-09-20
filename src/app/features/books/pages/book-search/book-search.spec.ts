import { TestBed } from '@angular/core/testing';
import { of, Subject, type Observable } from 'rxjs';

import type { BookSearchResult } from '../../models/book.model';
import { BookSearchService } from '../../services/book-search.service';
import { BookSearchComponent } from './book-search';
import { vi } from 'vitest';

describe('BookSearchComponent', () => {
  const searchCalls: Array<{ query: string; page: number }> = [];
  let searchImplementation: (query: string, page: number) => Observable<BookSearchResult>;

  beforeEach(async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: vi.fn(),
    });

    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: vi.fn(),
    });

    searchCalls.length = 0;

    searchImplementation = (_query, page) => of(createResult(page));

    await TestBed.configureTestingModule({
      imports: [BookSearchComponent],
      providers: [
        {
          provide: BookSearchService,
          useValue: {
            search: (query: string, page = 1) => {
              searchCalls.push({ query, page });
              return searchImplementation(query, page);
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('creates', () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('searches after the 300ms debounce and renders results', async () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'dune';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    expect(searchCalls).toEqual([{ query: 'dune', page: 1 }]);
    expect(fixture.nativeElement.textContent).toContain('Dune');
  });

  it('does not search for a one-character query', async () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'd';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    expect(searchCalls).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Enter at least 3 characters to search.');
  });

  it('does not search for a two-character query', async () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'du';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    expect(searchCalls).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Enter at least 3 characters to search.');
  });

  it('searches a three-character query after the debounce', async () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'dun';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    expect(searchCalls).toEqual([{ query: 'dun', page: 1 }]);
  });

  it('trims whitespace before validating a short query', async () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = ' d ';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    expect(searchCalls).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Enter at least 3 characters to search.');
  });

  it('ignores trailing whitespace without clearing results or searching again', async () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'dune';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    input.value = 'dune ';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    expect(searchCalls).toEqual([{ query: 'dune', page: 1 }]);
    expect(fixture.nativeElement.textContent).toContain('Dune');
  });

  it('appends the next page when Load more is clicked', async () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'dune';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.load-more button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(searchCalls).toEqual([
      { query: 'dune', page: 1 },
      { query: 'dune', page: 2 },
    ]);
    expect(fixture.nativeElement.textContent).toContain('Dune Messiah');
  });

  it('ignores a stale Load more response after a newer search', async () => {
    const pageTwo = new Subject<BookSearchResult>();
    searchImplementation = (query, page) => {
      if (query === 'dune' && page === 2) {
        return pageTwo;
      }

      return of(query === 'hobbit' ? createHobbitResult() : createResult(page));
    };

    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'dune';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.load-more button') as HTMLButtonElement).click();

    input.value = 'hobbit';
    input.dispatchEvent(new Event('input'));
    await waitForDebounce();
    fixture.detectChanges();

    pageTwo.next(createResult(2));
    pageTwo.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The Hobbit');
    expect(fixture.nativeElement.textContent).not.toContain('Dune Messiah');
  });

  it('opens book details when a result is clicked', async () => {
    const fixture = TestBed.createComponent(BookSearchComponent);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'dune';
    input.dispatchEvent(new Event('input'));

    await waitForDebounce();
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.book-card') as HTMLButtonElement;

    card.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-book-detail-dialog')).not.toBeNull();

    expect(fixture.nativeElement.textContent).toContain('Dune');
  });
});

function waitForDebounce(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 350));
}

function createResult(page: number): BookSearchResult {
  const book =
    page === 1
      ? {
          id: '/works/OL1W',
          title: 'Dune',
          authors: ['Frank Herbert'],
          firstPublishYear: 1965,
          coverId: null,
        }
      : {
          id: '/works/OL2W',
          title: 'Dune Messiah',
          authors: ['Frank Herbert'],
          firstPublishYear: 1969,
          coverId: null,
        };

  return { books: [book], total: 2 };
}

function createHobbitResult(): BookSearchResult {
  return {
    books: [
      {
        id: '/works/OL27448W',
        title: 'The Hobbit',
        authors: ['J. R. R. Tolkien'],
        firstPublishYear: 1937,
        coverId: null,
      },
    ],
    total: 1,
  };
}
