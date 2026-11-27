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
  arrayValue?: { values?: FirestoreField[] };
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
  const getNumber = (key: string) => {
    const field = fields[key];
    if (!field) return 0;

    // Older catalog records were saved as stringValue (e.g. "$ 1,299" and
    // "304 páginas"). Keep them readable while new records use true numbers.
    const raw = field.integerValue ?? field.doubleValue ?? field.stringValue ?? '';
    const normalized = String(raw).replace(/[^\d.]/g, '');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : 0;
  };

  return {
    id: doc.name.split('/').at(-1) || getString('id'),
    title: getString('title') || getString('titulo'),
    author: getString('author') || getString('autor') || 'Autor no disponible',
    publisher: getString('editorial') || getString('publisher') || 'No disponible',
    price: getNumber('price') || getNumber('precio'),
    description: getString('description') || getString('descripcion') || 'Descripción no disponible.',
    category: getString('category') || 'Catálogo',
    format: getString('format') || 'No disponible',
    pages: getNumber('pages') || getNumber('num_paginas'),
    isbn: getString('isbn'),
    searchTerms: fields.searchTerms?.arrayValue?.values?.map(value => value.stringValue ?? '') ?? [getString('textFromQuery')],
    stock: getNumber('stock') || 1,
    delivery: (() => {
      const raw = getString('delivery') || getString('tiempo_entrega') || '15 a 20 días háb.';
      // Transform "Envío rápido" to calculate arrival day from today (+7 days)
      if (raw.includes('rápido') || raw.includes('rápido') || raw.includes('Rápido')) {
        const hoy = new Date();
        const fechaLlegada = new Date(hoy);
        fechaLlegada.setDate(fechaLlegada.getDate() + 7);
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `Envío rápido (llega el ${fechaLlegada.getDate()} de ${meses[fechaLlegada.getMonth()]})`;
      }
      return raw;
    })(),
    coverTone: getString('coverTone') || 'midnight',
    imageUrl: getString('imageUrl') || getString('image_url') || getString('portada'),
    badge: getString('badge') || undefined,
    source: getString('source'),
    originCountry: getString('originCountry'),
    sellerName: getString('sellerName'),
    sellerLocation: getString('sellerLocation'),
    sellerReputation: getString('sellerReputation'),
    sellerRating: fields.sellerRating?.integerValue !== undefined || fields.sellerRating?.doubleValue !== undefined
      ? getNumber('sellerRating') : undefined,
    shippingNotes: getString('shippingNotes'),
    priceIncludesShipping: fields.priceIncludesShipping?.booleanValue,
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
  const books = new Map<string, Book>();
  const seenTokens = new Set<string>();
  let pageToken = '';
  do {
    const params = new URLSearchParams({ pageSize: '300' });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await fetch(`${endpoint}?${params}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      throw new Error(`No fue posible consultar el catálogo de Firebase (${response.status}).`);
    }
    const data = (await response.json()) as {
      documents?: Array<{ name: string; fields: FirestoreValue }>;
      nextPageToken?: string;
    };
    for (const doc of data.documents ?? []) {
      const book = mapFirestoreBook(doc);
      books.set(book.id, book);
    }
    pageToken = data.nextPageToken ?? '';
    if (pageToken && seenTokens.has(pageToken)) throw new Error('Firebase repitió una página del catálogo.');
    seenTokens.add(pageToken);
  } while (pageToken);
  return [...books.values()];
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { success: true, projectId, collection };
    }

    const text = await response.text();
    return { success: false, projectId, collection, error: `HTTP ${response.status}: ${text}` };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        projectId,
        collection,
        error: 'Request timed out after 10000ms',
      };
    }
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
  return fetchFirebaseCatalog();
}

/** Cuenta todos los documentos sin depender del filtro ni de la página visible. */
export async function getCatalogCount(): Promise<number> {
  if (source === 'mock') return mockBooks.length;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const collection = import.meta.env.VITE_FIRESTORE_COLLECTION ?? 'books';
  if (!projectId) throw new Error('Falta configurar Firebase.');
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: collection }] }, aggregations: [{ alias: 'total', count: {} }] } }),
  });
  if (!response.ok) throw new Error(`No se pudo contar el catálogo (${response.status}).`);
  const rows = await response.json();
  const raw = rows.find((row: { result?: { aggregateFields?: { total?: { integerValue?: string } } } }) => row.result?.aggregateFields?.total)?.result?.aggregateFields?.total?.integerValue;
  const count = Number(raw);
  if (raw === undefined || !Number.isSafeInteger(count) || count < 0) throw new Error('Firebase no devolvió un total válido.');
  return count;
}
