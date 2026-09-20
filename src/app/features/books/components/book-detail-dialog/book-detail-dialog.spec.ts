import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Book } from '../../models/book.model';
import { BookDetailDialogComponent } from './book-detail-dialog';

describe('BookDetailDialogComponent', () => {
  let fixture: ComponentFixture<BookDetailDialogComponent>;

  beforeEach(async () => {
    if (!HTMLDialogElement.prototype.showModal) {
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: () => undefined });
    }

    await TestBed.configureTestingModule({
      imports: [BookDetailDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(BookDetailDialogComponent);
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
