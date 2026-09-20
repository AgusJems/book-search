import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Book } from '../../models/book.model';
import { BookCardComponent } from './book-card';

describe('BookCardComponent', () => {
  let fixture: ComponentFixture<BookCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(BookCardComponent);
    fixture.componentRef.setInput('book', createBook());
    fixture.detectChanges();
  });

  it('creates with its required Book input', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('The Hobbit');
  });
});

function createBook(): Book {
  return {
    id: '/works/OL1W',
    title: 'The Hobbit',
    authors: ['J. R. R. Tolkien'],
    firstPublishYear: 1937,
    coverId: null,
  };
}
