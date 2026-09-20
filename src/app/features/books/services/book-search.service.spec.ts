import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BookSearchService } from './book-search.service';

describe('BookSearchService', () => {
  let service: BookSearchService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookSearchService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookSearchService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('requests the selected Open Library page with useful fields', () => {
    service.search('dune', 2).subscribe((result) => {
      expect(result.total).toBe(1);
      expect(result.books[0].title).toBe('Dune');
    });

    const request = httpTesting.expectOne(
      (request) => request.url === 'https://openlibrary.org/search.json',
    );
    expect(request.request.params.get('q')).toBe('dune');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('fields')).toBe(
      'key,title,author_name,first_publish_year,cover_i',
    );
    request.flush({ numFound: 1, docs: [{ key: '/works/OL1W', title: 'Dune' }] });
  });

  it("sends the user's raw query", () => {
    service.search('1968').subscribe();

    const request = httpTesting.expectOne(
      (request) => request.url === 'https://openlibrary.org/search.json',
    );
    expect(request.request.params.get('q')).toBe('1968');
    request.flush({ numFound: 0, docs: [] });
  });
});
