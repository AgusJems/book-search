import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import type { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  templateUrl: './book-card.html',
  styleUrl: './book-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCardComponent {
  readonly book = input.required<Book>();
  readonly bookSelected = output<Book>();

  protected readonly coverUnavailable = signal(false);

  protected markCoverUnavailable(): void {
    this.coverUnavailable.set(true);
  }

  protected selectBook(): void {
    this.bookSelected.emit(this.book());
  }
}
