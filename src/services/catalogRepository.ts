import { mockBooks } from '../data/mockBooks';
import type { Book } from '../types';

// Firebase is the normal catalog source.  Mocks remain available only while
// configuring a project, or when VITE_CATALOG_SOURCE=mock is explicitly set.
const source = import.meta.env.VITE_CATALOG_SOURCE ?? 'firebase';

/**
 * Firestore document field types returned by the REST API v1.
 * See: https://firebase.google.com/docs/firestore/rest/v1
 */
type FirestoreField = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
};

type FirestoreValue = Record<string, FirestoreField>;

/**
 * Maps a Firestore document to a Book domain object.
 * The Firestore REST API returns fields wrapped in type objects;
 * this function extracts the raw values.
 */
function mapFirestoreBook(doc: { name: string; fields: FirestoreValue }): Book {
  const fields = doc.fields;
  const getString = (key: string) => fields[key]?.stringValue ?? '';
  const getNumber = (key: string) =>
    Number(fields[key]?.integerValue ?? fields[key]?.doubleValue ?? 0);

  return {
    id: getString('id') || doc.name.split('/').at(-1) || crypto.randomUUID(),
    title: getString('title') || getString('titulo'),
    author: getString('author') || getString('autor') || 'Autor no disponible',
    price: getNumber('price') || getNumber('precio'),
    description: getString('description') || getString('descripcion') || 'Descripción no disponible.',
    category: getString('category') || 'Catálogo',
    format: getString('format') || 'No disponible',
    pages: getNumber('pages') || getNumber('num_paginas'),
    isbn: getString('isbn'),
    stock: getNumber('stock') || 1,
    delivery: getString('delivery') || getString('tiempo_entrega') || 'Consulta disponibilidad',
    coverTone: getString('coverTone') || 'midnight',
    imageUrl: getString('imageUrl'),
    badge: getString('badge') || undefined,
  };
}

/**
 * Fetches the book catalog from Firestore via the REST API.
 * Reads from the project and collection configured in environment variables:
 *   - VITE_FIREBASE_PROJECT_ID (required)
 *   - VITE_FIRESTORE_COLLECTION (defaults to 'books')
 *
 * The webPlatform is already configured to use the same Firebase project
 * as the scraper: project "store-ea555", collection "books".
 */
async function fetchFirebaseCatalog(): Promise<Book[]> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const collection = import.meta.env.VITE_FIRESTORE_COLLECTION ?? 'books';

  if (!projectId) {
    throw new Error(
      'Falta VITE_FIREBASE_PROJECT_ID en el archivo .env. ' +
        'Asegúrate de que el webPlatform esté conectado a la misma Firebase project que el scraper (store-ea555).',
    );
  }

  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `No fue posible consultar el catálogo de Firebase (${response.status}). ` +
        `Verifica que la base de datos existe y que las credenciales son correctas. Detalle: ${text}`,
    );
  }

  const data = (await response.json()) as {
    documents?: Array<{ name: string; fields: FirestoreValue }>;
  };

  return (data.documents ?? []).map(mapFirestoreBook);
}

/**
 * Verifica la conexión con Firebase Firestore.
 * Útil para debugging y asegurar que el webPlatform está conectado
 * a la misma base de datos que el scraper.
 */
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  projectId: string;
  collection: string;
  error?: string;
}> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const collection = import.meta.env.VITE_FIRESTORE_COLLECTION ?? 'books';

  if (!projectId) {
    return { success: false, projectId: '', collection, error: 'VITE_FIREBASE_PROJECT_ID no configurado' };
  }

  try {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?limit=1`;
    const response = await fetch(endpoint, { method: 'GET', timeout: 10000 });

    if (response.ok) {
      return { success: true, projectId, collection };
    }

    const text = await response.text();
    return { success: false, projectId, collection, error: `HTTP ${response.status}: ${text}` };
  } catch (err) {
    return {
      success: false,
      projectId,
      collection,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

export async function getCatalog(): Promise<Book[]> {
  if (source === 'mock') return mockBooks;
  // Fallback to mock while the Firebase project is being configured,
  // while production reads the shared Firestore collection.
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return mockBooks;
  return fetchFirebaseCatalog();
}
