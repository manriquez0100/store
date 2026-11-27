export type Book = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  price: number;
  description: string;
  category: string;
  format: string;
  pages: number;
  isbn: string;
  searchTerms?: string[];
  stock: number;
  delivery: string;
  coverTone: string;
  imageUrl?: string;
  badge?: string;
};
