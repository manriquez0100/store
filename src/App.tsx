import { useEffect, useMemo, useState } from 'react';
import { getCatalog, getCatalogCount } from './services/catalogRepository';
import { CatalogReach } from './CatalogReach';
import { matchesBook, normalizeSearch } from './services/catalogSearch';
import type { Book } from './types';

const WHATSAPP_NUMBER = '524771376775';
const BOOKS_PER_PAGE = 20;
const PAGE_BUTTONS = 10;
const paypalPaymentUrl = import.meta.env.VITE_PAYPAL_PAYMENT_URL ?? 'https://www.paypal.com/';

function shuffleBooks(books: Book[]) {
  const shuffled = [...books];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function money(amount: number) {
  return amount > 0
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
    : 'Consultar precio';
}

function Cover({ book, large = false, imageUrl = book.imageUrl, imageAlt }: { book: Book; large?: boolean; imageUrl?: string; imageAlt?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageUrl]);
  const hasImage = Boolean(imageUrl?.trim()) && !failed;
  return (
    <div className="branded-cover">
      <p className="cover-brand">Los libros de la buena memoria</p>
      <div className={`book-cover ${book.coverTone} ${large ? 'book-cover-large' : ''} ${hasImage ? 'has-photo' : ''}`}>
      {hasImage && <img className="book-photo" src={imageUrl} alt={imageAlt || `Portada de ${book.title}`} loading={large ? 'eager' : 'lazy'} onError={() => setFailed(true)} />}
      {!hasImage && <><span className="cover-stamp">LBM</span><strong>{book.title}</strong><small>{book.author}</small></>}
      {hasImage && <span className="cover-stamp image-stamp">LBM</span>}
      </div>
    </div>
  );
}

export function BookGallery({ book, large = false, onOpen }: { book: Book; large?: boolean; onOpen?: () => void }) {
  const images = [...new Set([book.imageUrl, ...(book.imageUrls || [])].filter((url): url is string => !!url?.trim()))];
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(0, images.length - 1));
  useEffect(() => setIndex(0), [book.id]);
  const cover = <Cover book={book} large={large} imageUrl={images[current]} imageAlt={`Foto ${current + 1} de ${images.length} de ${book.title}`} />;
  return <div className={`book-gallery ${large ? 'book-gallery-large' : ''}`} role="group" aria-roledescription="carrusel" aria-label={`Imágenes de ${book.title}`}>
    {onOpen ? <button className="cover-button" onClick={onOpen} aria-label={`Ver ${book.title}`}>{cover}</button> : cover}
    {images.length > 1 && <>
      <button type="button" className="gallery-arrow gallery-prev" aria-label={`Imagen anterior de ${book.title}`} onClick={() => setIndex((current + images.length - 1) % images.length)}>{'<'}</button>
      <button type="button" className="gallery-arrow gallery-next" aria-label={`Siguiente imagen de ${book.title}`} onClick={() => setIndex((current + 1) % images.length)}>{'>'}</button>
      <span className="gallery-count" aria-live="polite" aria-atomic="true">{current + 1} / {images.length}</span>
    </>}
  </div>;
}

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const firstPage = Math.max(1, Math.min(currentPage, totalPages - PAGE_BUTTONS + 1));
  const lastPage = Math.min(firstPage + PAGE_BUTTONS - 1, totalPages);

  return <nav className="pagination" aria-label="Paginación del catálogo">
    <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>← Anterior</button>
    <div className="pagination-pages">
      {firstPage > 1 && <span className="pagination-ellipsis" aria-label="Más páginas anteriores">…</span>}
      {Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index).map((page) => (
        <button type="button" key={page} className={page === currentPage ? 'is-current' : ''} onClick={() => onPageChange(page)} aria-current={page === currentPage ? 'page' : undefined} aria-label={`Página ${page}`}>
          {page}
        </button>
      ))}
      {lastPage < totalPages && <span className="pagination-ellipsis" aria-label="Más páginas siguientes">…</span>}
    </div>
    <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente →</button>
  </nav>;
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(() => location.hash.replace('#/libro/', '') || null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function refreshCatalog() {
    setRefreshing(true);
    try {
      const updatedBooks = await getCatalog();
      setBooks(updatedBooks);
      setCatalogTotal(await getCatalogCount().catch(() => updatedBooks.length));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el catálogo.');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    getCatalog().then(items => { setBooks(items); setCatalogTotal(current => current ?? items.length); }).catch((cause: Error) => setError(cause.message)).finally(() => setLoading(false));
    const updateCount = () => { getCatalogCount().then(setCatalogTotal).catch(() => {}); };
    updateCount();
    const countTimer = window.setInterval(updateCount, 60000);
    addEventListener('focus', updateCount);
    const onHashChange = () => setSelectedId(location.hash.replace('#/libro/', '') || null);
    addEventListener('hashchange', onHashChange);
    return () => { removeEventListener('hashchange', onHashChange); removeEventListener('focus', updateCount); clearInterval(countTimer); };
  }, []);

  const selectedBook = books.find((book) => book.id === selectedId);
  const homeSelection = useMemo(() => shuffleBooks(books), [books, selectionVersion]);
  const visibleBooks = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    if (!normalized) return homeSelection;
    const titleQuery = normalizeSearch(query);
    return books.filter((book) => matchesBook(book, query)).sort((a, b) => {
      const titleScore = (title: string) => {
        const value = normalizeSearch(title);
        if (value === titleQuery) return 2;
        return value.includes(titleQuery) ? 1 : 0;
      };
      return titleScore(b.title) - titleScore(a.title);
    });
  }, [books, homeSelection, query]);
  const totalPages = Math.ceil(visibleBooks.length / BOOKS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const pageBooks = useMemo(() => {
    const firstBook = (currentPage - 1) * BOOKS_PER_PAGE;
    return visibleBooks.slice(firstBook, firstBook + BOOKS_PER_PAGE);
  }, [currentPage, visibleBooks]);
  const themes = useMemo(() => {
    const categories = Array.from(new Set(books.map((book) => book.category.trim()).filter(Boolean)))
      .sort((first, second) => first.localeCompare(second, 'es-MX'));
    return [
      { label: 'Todos los libros', search: '' },
      ...categories.map((category) => ({ label: category, search: category })),
    ];
  }, [books]);
  const normalizedQuery = query.trim().toLocaleLowerCase('es-MX');
  const featuredBook = visibleBooks[0] ?? books[0];
  const openBook = (id: string) => { location.hash = `/libro/${id}`; scrollTo({ top: 0, behavior: 'smooth' }); };
  const goHome = () => { location.hash = ''; setQuery(''); setPage(1); };

  if (selectedId && selectedBook) return <BookDetail book={selectedBook} onBack={goHome} />;

  return <main>
    <header className="site-header">
      <button className="brand" onClick={goHome} aria-label="Ir al inicio"><span>LBM</span><b>Los libros de la buena memoria</b></button>
      <nav><a href="#catalogo">Catálogo</a><a className="header-cta" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">Te ayudamos a buscar</a></nav>
    </header>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">Librería independiente · México</p><h1>Los libros de<br /><em>la buena memoria.</em></h1><p>Buscamos el libro que no has encontrado y lo llevamos a la puerta de tu casa.</p><CatalogReach total={catalogTotal} /><a className="primary-link" href="#catalogo">Explorar el catálogo <span>↓</span></a></div>
      {featuredBook && <button className="hero-book" onClick={() => openBook(featuredBook.id)}><Cover book={featuredBook} large /><span>Descubre la selección de hoy <b>→</b></span></button>}
    </section>
    <section className="catalog" id="catalogo">
      <div className="catalog-layout">
        <aside className="theme-panel" aria-label="Temas del catálogo">
          <p className="eyebrow">Explora por tema</p>
          <div className="theme-list">
            {themes.map((theme) => {
              const active = normalizedQuery === theme.search.toLocaleLowerCase('es-MX');
              return <button className={`theme-button ${active ? 'is-active' : ''}`} key={theme.search || 'all'} onClick={() => { setQuery(theme.search); setPage(1); }}>{theme.label}<span>→</span></button>;
            })}
          </div>
        </aside>
        <div className="catalog-content">
          <div className="catalog-top"><div><p className="eyebrow">La estantería</p><h2>{query ? 'Resultados para tu búsqueda' : 'Encuentra tu próximo libro'}</h2></div><label className="search" htmlFor="book-search"><span>⌕</span><input id="book-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Título, autor o tema" /></label></div>
          <div className="catalog-meta"><span>{visibleBooks.length} {visibleBooks.length === 1 ? 'título' : 'títulos'} disponibles</span>{!query && <button className="refresh-selection" onClick={() => { setSelectionVersion((version) => version + 1); setPage(1); }}>↻ Ver otra selección</button>}<span>Envíos a todo México</span></div>
          {loading && <p className="status">Ordenando los libros para ti…</p>}
          <button className="refresh-selection" disabled={loading || refreshing} onClick={refreshCatalog}>
            {refreshing ? 'Actualizando catálogo…' : 'Actualizar catálogo'}
          </button>
          {error && <p className="status error">{error}</p>}
          {!loading && !error && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />}
          {!loading && !error && <div className="book-grid">{pageBooks.map((book) => <article className="book-card" key={book.id}><BookGallery book={book} onOpen={() => openBook(book.id)} /><div className="book-card-info">{book.badge && <span className="tag">{book.badge}</span>}<p>{book.author}</p><h3>{book.title}</h3><div><strong>{money(book.price)}</strong><button onClick={() => openBook(book.id)} aria-label={`Ver ${book.title}`}>Ver libro <span>→</span></button></div></div></article>)}</div>}
          {!loading && !error && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />}
          {!loading && !error && visibleBooks.length === 0 && <p className="status">No encontramos ese título. Prueba con el autor o una palabra distinta.</p>}
        </div>
      </div>
    </section>
    <section className="trust-strip"><span>✦ Pagos seguros</span><span>✦ Envíos nacionales</span><span>✦ Atención humana por WhatsApp</span></section>
    <footer>LBM <span>·</span> Libros que vuelven a encontrarte</footer>
  </main>;
}

function SellerReputation({ book }: { book: Book }) {
  const legacy = book.sellerReputation?.match(/([0-5](?:[.,]\d+)?)\s*(?:-star|stars?|estrellas?)/i);
  const rating = book.sellerRating ?? (legacy ? Number(legacy[1].replace(',', '.')) : undefined);
  if (rating === undefined || !Number.isFinite(rating) || rating < 0 || rating > 5) {
    return <span>{book.sellerReputation || 'No disponible'}</span>;
  }
  return <span className="seller-reputation" aria-label={`Reputación del vendedor: ${rating} de 5 estrellas`}>
    <span className="seller-stars" aria-hidden="true">
      <span>★★★★★</span>
      <span className="seller-stars-filled" style={{ width: `${rating / 5 * 100}%` }}>★★★★★</span>
    </span>
    <span>{rating}/5</span>
  </span>;
}

function BookDetail({ book, onBack }: { book: Book; onBack: () => void }) {
  const whatsappMessage = encodeURIComponent(`Hola, quiero comprar “${book.title}” por ${money(book.price)}.`);
  return <main>
    <header className="site-header"><button className="brand" onClick={onBack}><span>LBM</span><b>Los libros de la buena memoria</b></button><button className="back-link" onClick={onBack}>← Volver al catálogo</button></header>
    <section className="detail-layout">
      <div className="detail-cover"><BookGallery book={book} large /></div>
      <article className="detail-copy">
        <p className="eyebrow">{book.category}</p>
        <h1>{book.title}</h1>
        <h2>{book.author}</h2>
        {book.source === 'abebooks' && <AbeBooksOffer book={book} />}
        <p className="description">{book.description}</p>
        <dl>
          <div><dt>Editorial</dt><dd>{book.publisher}</dd></div>
          <div><dt>Páginas</dt><dd>{book.pages > 0 ? `${book.pages} páginas` : 'No disponible'}</dd></div>
          <div><dt>Formato</dt><dd>{book.format}</dd></div>
          <div><dt>ISBN</dt><dd>{book.isbn || 'No disponible'}</dd></div>
        </dl>
      </article>
      <aside className="purchase-card"><p className="stock">● {book.stock > 0 ? `${book.stock} disponible${book.stock === 1 ? '' : 's'}` : 'Consulta existencias'}</p><strong className="price">{money(book.price)}</strong><p className="delivery">⌁ {book.delivery}</p><a className="paypal-button" href={paypalPaymentUrl} target="_blank" rel="noreferrer">Pagar con <b>PayPal</b></a><div className="divider"><span>o</span></div><a className="oxxo-button" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`} target="_blank" rel="noreferrer">Comprar por WhatsApp</a><p className="payment-note">Escríbenos y te acompañamos con el pago y los datos de envío.</p></aside>
    </section>
    <section className="purchase-steps"><p className="eyebrow">Comprar es sencillo</p><div><p><b>01</b> Elige tu forma de pago.</p><p><b>02</b> Comparte tus datos de envío.</p><p><b>03</b> Recibe confirmación y seguimiento.</p></div></section>
  </main>;
}

export default App;

function AbeBooksOffer({ book }: { book: Book }) {
  const country = book.originCountry === 'Spain' ? 'España' : book.originCountry;
  return <section className="abebooks-offer" aria-label="Procedencia y vendedor">
    <h3>Procedencia y vendedor</h3>
    <dl className="abebooks-offer-data">
      <div><dt>País de origen</dt><dd>{country || 'Por confirmar'}</dd></div>
      <div><dt>Librería vendedora</dt><dd>{book.sellerName || 'Por confirmar'}</dd></div>
      <div><dt>Reputación del vendedor</dt><dd><SellerReputation book={book} /></dd></div>
    </dl>
    <p className="international-price-note">El precio puede ser más alto debido al país de origen del libro y los costos de envío internacional a México.</p>
    {book.priceIncludesShipping === true && <p className="offer-shipping-status">El precio incluye envío a México.</p>}
    {book.priceIncludesShipping === false && <p className="offer-shipping-status">Envío a México pendiente de cotizar.</p>}
    <details>
      <summary>Ubicación y detalles del envío</summary>
      <p>{book.sellerLocation || 'Ubicación por confirmar'}</p>
      <p>{book.delivery}</p>
      <p>{book.shippingNotes || 'Pendiente de confirmar con el vendedor.'}</p>
    </details>
  </section>;
}
