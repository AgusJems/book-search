import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: "Agus' Shelf",
    loadComponent: () =>
      import('./features/books/pages/book-search/book-search').then(
        (component) => component.BookSearchComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
