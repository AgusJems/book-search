import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';

import type { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-detail-dialog',
  standalone: true,
  templateUrl: './book-detail-dialog.html',
  styleUrl: './book-detail-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetailDialogComponent {
  readonly book = input.required<Book>();
  readonly dismissed = output<void>();
  protected readonly coverUnavailable = signal(false);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected markCoverUnavailable(): void {
    this.coverUnavailable.set(true);
  }

  protected onClosed(): void {
    this.dismissed.emit();
  }
}
