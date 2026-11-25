import type { Book } from '../types';

export const mockBooks: Book[] = [
  {
    id: 'segunda-fundacion', title: 'Segunda Fundación', author: 'Isaac Asimov', price: 289,
    category: 'Ciencia ficción', format: 'Pasta blanda', pages: 304, isbn: '978-607-381-650-2', stock: 4,
    delivery: 'Envío rápido', coverTone: 'midnight', badge: 'Más buscado',
    description: 'El desenlace de la trilogía original de Fundación. Dos poderes ocultos compiten por orientar el futuro de la humanidad.',
  },
  {
    id: 'hombre-en-busca-de-sentido', title: 'El hombre en busca de sentido', author: 'Viktor E. Frankl', price: 339,
    category: 'Psicología', format: 'Pasta blanda', pages: 184, isbn: '978-842-543-206-5', stock: 6,
    delivery: 'Entrega estimada: 3 a 5 días hábiles', coverTone: 'terracotta', badge: 'Recomendado',
    description: 'Un testimonio y reflexión esencial sobre encontrar propósito aun en las circunstancias más difíciles.',
  },
  {
    id: 'el-evangelio-de-judas', title: 'El evangelio de Judas', author: 'Rodolfo Gil', price: 315,
    category: 'Historia', format: 'Pasta blanda', pages: 224, isbn: '978-607-113-495-0', stock: 3,
    delivery: 'Entrega estimada: 5 a 7 días hábiles', coverTone: 'ochre',
    description: 'Una mirada accesible a los textos, contextos e interpretaciones alrededor de una de las figuras más enigmáticas del cristianismo.',
  },
  {
    id: 'cien-anos-de-soledad', title: 'Cien años de soledad', author: 'Gabriel García Márquez', price: 389,
    category: 'Literatura latinoamericana', format: 'Pasta blanda', pages: 496, isbn: '978-607-074-246-0', stock: 7,
    delivery: 'Envío rápido', coverTone: 'jungle', badge: 'Clásico',
    description: 'La historia de la familia Buendía y del universo inolvidable de Macondo.',
  },
  {
    id: 'sapiens', title: 'Sapiens', author: 'Yuval Noah Harari', price: 429,
    category: 'Historia', format: 'Pasta blanda', pages: 496, isbn: '978-607-319-621-5', stock: 5,
    delivery: 'Entrega estimada: 3 a 5 días hábiles', coverTone: 'clay',
    description: 'Un recorrido provocador por las ideas que transformaron a Homo sapiens en la especie dominante.',
  },
  {
    id: 'pedro-paramo', title: 'Pedro Páramo', author: 'Juan Rulfo', price: 249,
    category: 'Literatura mexicana', format: 'Pasta blanda', pages: 136, isbn: '978-607-314-990-7', stock: 8,
    delivery: 'Envío rápido', coverTone: 'ocean',
    description: 'Una novela breve, poderosa y fundacional sobre memoria, culpa y las voces de Comala.',
  },
];
