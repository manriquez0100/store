import { useEffect, useMemo, useState } from 'react';
import { getCatalog } from './services/catalogRepository';
import type { Book } from './types';

const WHATSAPP_NUMBER = '524771376775';
const paypalPaymentUrl = import.meta.env.VITE_PAYPAL_PAYMENT_URL ?? 'https://www.paypal.com/';

function money(amount: number) {
  return amount > 0
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
    : 'Consultar precio';
}

function Cover({ book, large = false }: { book: Book; large?: boolean }) {
  const hasImage = Boolean(book.imageUrl?.trim());
  return (
    <div className={`book-cover ${book.coverTone} ${large ? 'book-cover-large' : ''}`} style={hasImage ? { backgroundImage: `url('${book.imageUrl}')` } : undefined} aria-label={`Portada de ${book.title}`}>
      {!hasImage && <><span className="cover-stamp">LBM</span><strong>{book.title}</strong><small>{book.author}</small></>}
      {hasImage && <span className="cover-stamp image-stamp">LBM</span>}
    </div>
  );
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(() => location.hash.replace('#/libro/', '') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCatalog().then(setBooks).catch((cause: Error) => setError(cause.message)).finally(() => setLoading(false));
    const onHashChange = () => setSelectedId(location.hash.replace('#/libro/', '') || null);
    addEventListener('hashchange', onHashChange);
    return () => removeEventListener('hashchange', onHashChange);
  }, []);

  const selectedBook = books.find((book) => book.id === selectedId);
  const visibleBooks = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    return normalized ? books.filter((book) => `${book.title} ${book.author} ${book.category}`.toLocaleLowerCase('es-MX').includes(normalized)) : books;
  }, [books, query]);
  const featuredBook = visibleBooks[0] ?? books[0];
  const openBook = (id: string) => { location.hash = `/libro/${id}`; scrollTo({ top: 0, behavior: 'smooth' }); };
  const goHome = () => { location.hash = ''; setQuery(''); };

  if (selectedId && selectedBook) return <BookDetail book={selectedBook} onBack={goHome} />;

  return <main>
    <header className="site-header">
      <button className="brand" onClick={goHome} aria-label="Ir al inicio"><span>LBM</span><b>Los libros de la buena memoria</b></button>
      <nav><a href="#catalogo">Catálogo</a><a className="header-cta" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">Te ayudamos a buscar</a></nav>
    </header>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">Librería independiente · México</p><h1>Los libros que<br /><em>siguen buscándote.</em></h1><p>Encontramos ediciones especiales, títulos difíciles y ese libro que ya no veías en ninguna parte.</p><a className="primary-link" href="#catalogo">Explorar el catálogo <span>↓</span></a></div>
      {featuredBook && <button className="hero-book" onClick={() => openBook(featuredBook.id)}><Cover book={featuredBook} large /><span>Descubre la selección de hoy <b>→</b></span></button>}
    </section>
    <section className="catalog" id="catalogo">
      <div className="catalog-top"><div><p className="eyebrow">La estantería</p><h2>{query ? 'Resultados para tu búsqueda' : 'Encuentra tu próximo libro'}</h2></div><label className="search" htmlFor="book-search"><span>⌕</span><input id="book-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Título, autor o tema" /></label></div>
      <div className="catalog-meta"><span>{visibleBooks.length} {visibleBooks.length === 1 ? 'título' : 'títulos'} disponibles</span><span>Envíos a todo México</span></div>
      {loading && <p className="status">Ordenando los libros para ti…</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && <div className="book-grid">{visibleBooks.map((book) => <article className="book-card" key={book.id}><button className="cover-button" onClick={() => openBook(book.id)}><Cover book={book} /></button><div className="book-card-info">{book.badge && <span className="tag">{book.badge}</span>}<p>{book.author}</p><h3>{book.title}</h3><div><strong>{money(book.price)}</strong><button onClick={() => openBook(book.id)} aria-label={`Ver ${book.title}`}>Ver libro <span>→</span></button></div></div></article>)}</div>}
      {!loading && !error && visibleBooks.length === 0 && <p className="status">No encontramos ese título. Prueba con el autor o una palabra distinta.</p>}
    </section>
    <section className="trust-strip"><span>✦ Pagos seguros</span><span>✦ Envíos nacionales</span><span>✦ Atención humana por WhatsApp</span></section>
    <footer>LBM <span>·</span> Libros que vuelven a encontrarte</footer>
  </main>;
}

function BookDetail({ book, onBack }: { book: Book; onBack: () => void }) {
  const whatsappMessage = encodeURIComponent(`Hola, quiero comprar “${book.title}” por ${money(book.price)}.`);
  return <main>
    <header className="site-header"><button className="brand" onClick={onBack}><span>LBM</span><b>Los libros de la buena memoria</b></button><button className="back-link" onClick={onBack}>← Volver al catálogo</button></header>
    <section className="detail-layout">
      <div className="detail-cover"><Cover book={book} large /></div>
      <article className="detail-copy"><p className="eyebrow">{book.category}</p><h1>{book.title}</h1><h2>{book.author}</h2><p className="description">{book.description}</p><dl><div><dt>Editorial</dt><dd>{book.publisher}</dd></div><div><dt>Páginas</dt><dd>{book.pages > 0 ? `${book.pages} páginas` : 'No disponible'}</dd></div><div><dt>Formato</dt><dd>{book.format}</dd></div><div><dt>ISBN</dt><dd>{book.isbn || 'No disponible'}</dd></div></dl></article>
      <aside className="purchase-card"><p className="stock">● {book.stock > 0 ? `${book.stock} disponible${book.stock === 1 ? '' : 's'}` : 'Consulta existencias'}</p><strong className="price">{money(book.price)}</strong><p className="delivery">⌁ {book.delivery}</p><a className="paypal-button" href={paypalPaymentUrl} target="_blank" rel="noreferrer">Pagar con <b>PayPal</b></a><div className="divider"><span>o</span></div><a className="oxxo-button" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`} target="_blank" rel="noreferrer">Comprar por WhatsApp</a><p className="payment-note">Escríbenos y te acompañamos con el pago y los datos de envío.</p></aside>
    </section>
    <section className="purchase-steps"><p className="eyebrow">Comprar es sencillo</p><div><p><b>01</b> Elige tu forma de pago.</p><p><b>02</b> Comparte tus datos de envío.</p><p><b>03</b> Recibe confirmación y seguimiento.</p></div></section>
  </main>;
}

export default App;
