import type { Book } from '../types';

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function matchesBook(book: Book, query: string): boolean {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  const text = normalizeSearch([
    book.title, book.author, book.category, book.publisher, book.isbn,
    ...(book.searchTerms ?? []),
  ].join(' '));
  return terms.every(term => text.includes(term));
}
