import { useEffect, useMemo, useState } from 'react';
import { getCatalog } from './services/catalogRepository';
import type { Book } from './types';

const WHATSAPP_NUMBER = '524771376775';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hola, busco un libro y me gustaría recibir atención personal.'
)}`;
const paypalPaymentUrl = import.meta.env.VITE_PAYPAL_PAYMENT_URL ?? 'https://www.paypal.com/';

function money(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Mezcla aleatoria (Fisher-Yates) */
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface SiteHeaderProps {
  onHome: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

function SiteHeader({ onHome, showBackButton = false, onBack }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className="site-header" role="banner">
      <div className="site-header-inner">
        <button
          type="button"
          className="brand"
          onClick={() => {
            onHome();
            setMenuOpen(false);
          }}
          aria-label="Los libros de la buena memoria - Ir al inicio"
        >
          <span className="brand-badge" aria-hidden="true">LBM</span>
        </button>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav
          id="primary-navigation"
          className={`site-nav ${menuOpen ? 'is-open' : ''}`}
          aria-label="Navegación principal"
        >
          {showBackButton && onBack ? (
            <button
              type="button"
              className="back-link"
              onClick={() => {
                onBack();
                setMenuOpen(false);
              }}
            >
              ← Volver al catálogo
            </button>
          ) : (
            <>

            </>
          )}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="nav-cta"
            onClick={handleNavClick}
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}

function Cover({ book, featured = false }: { book: Book; featured?: boolean }) {
  const hasImage = Boolean(book.imageUrl && book.imageUrl.trim().length > 0);
  return (
    <div
      className={`book-cover ${book.coverTone} ${featured ? 'featured-cover' : ''}`}
      aria-label={`Portada de ${book.title}`}
      style={
        hasImage
          ? {
              backgroundImage: `url('${book.imageUrl}')`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
            }
          : {}
      }
    >
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <article
      className="book-card"
      tabIndex={0}
      role="button"
      onClick={() => {
        window.location.hash = `/libro/${book.id}`;
      }}
    >
      <button
        type="button"
        className="cover-button"
        aria-label={`Ver libro: ${book.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Cover book={book} />
      </button>
      <div className="book-card-info">
        <p className="book-author">{book.author}</p>
        <h3 className="book-title">{book.title}</h3>
        <div className="book-price">{book.price > 0 ? money(book.price) : 'Consultar'}</div>
      </div>
    </article>
  );
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(
    () => location.hash.replace('#/libro/', '') || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCatalog()
      .then(setBooks)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));

    const onHashChange = () => setSelectedId(location.hash.replace('#/libro/', '') || null);
    addEventListener('hashchange', onHashChange);
    return () => removeEventListener('hashchange', onHashChange);
  }, []);

  const selectedBook = books.find((book) => book.id === selectedId);
  const visibleBooks = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es-MX');
    return normalized
      ? books.filter((book) =>
          `${book.title} ${book.author} ${book.category}`
            .toLocaleLowerCase('es-MX')
            .includes(normalized)
        )
      : books;
  }, [books, query]);

  const normalizedQuery = useMemo(() => query.trim().toLocaleLowerCase('es-MX'), [query]);
  const featuredBooks = useMemo(() => shuffleArray(books), [books]);

  const goHome = () => {
    location.hash = '';
    setQuery('');
  };

  if (selectedId && selectedBook) {
    return <BookDetail book={selectedBook} onBack={goHome} />;
  }

  return (
    <main>
      <SiteHeader onHome={goHome} />

      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-eyebrow">Librería independiente · México</p>
          <h1 className="hero-title">
            Buscamos el libro que no has encontrado y lo entregamos en tu domicilio.
          </h1>
          <p className="hero-subtitle">
            Ayudamos a encontrar libros difíciles de conseguir, descatalogados y títulos bajo pedido.
          </p>
          <div className="hero-cta">
            <a href="#catalogo" className="cta-button">Encuentra tu libro</a>
          </div>
        </div>
      </section>

      {/* === 2. BARRA DE BÚSQUEDA === */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-wrapper" role="search">
            <input
              id="book-search"
              type="text"
              className="search-input"
              aria-label="Buscar libros"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="¿Qué libro estás buscando?"
            />

            <span className="search-icon">🔍</span>
            <span className="search-focus-indicator"></span>
            <span className="search-clear" aria-label="Limpiar búsqueda" onClick={(e) => {
              e.stopPropagation();
              setQuery('');
            }}>&times;</span>
          </div>
        </div>
      </section>

      <section className="catalog" id="catalogo">
        <div className="section-heading">
         
          <p>{visibleBooks.length} títulos</p>
        </div>

        {loading && <p className="status">Cargando catálogo…</p>}
        {error && <p className="status error">{error}</p>}

        {!loading && !error && (
          <div className="book-grid">
            {/* Sección de libros destacados aleatorios */}
            {featuredBooks.length > 0 && (
              <div className="featured-books-section">
                <p className="featured-section-eyebrow">Destacados</p>
                <h3 className="featured-section-title">Libros que te encantarán</h3>
                <p className="featured-section-subtitle">
                  Una selección aleatoria de nuestro catálogo disponible
                </p>
              </div>
            )}

            {/* Tarjetas de libros */}
            {visibleBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}

            {!loading && !error && visibleBooks.length === 0 && (
              <p className="status">
                No encontramos ese título. Pruebe con el autor o una palabra distinta.
              </p>
            )}
          </div>
        )}

        {/* Mostrar libros adicionales después de los destacados cuando haya más libros */}
        {featuredBooks.length > 0 && visibleBooks.length > featuredBooks.length && (
          <div className="more-books-notice">
            <p className="more-section-eyebrow">Más libros disponibles</p>
            <h3 className="more-section-title">Seguimos buscando...</h3>
            <p className="more-section-subtitle">
              {visibleBooks.length - featuredBooks.length} títulos más en nuestro catálogo
            </p>
          </div>
        )}
      </section>

      <section className="trust-strip">
        <span>✦ Pago seguro</span>
        <span>✦ Envíos a todo México</span>
        <span>✦ Atención por WhatsApp</span>
      </section>

      <footer>
        Los libros de la buena memoria <span>·</span> Libros que vuelven a encontrarte
      </footer>
    </main>
  );
}

function BookDetail({ book, onBack }: { book: Book; onBack: () => void }) {
  const whatsappMessage = encodeURIComponent(
    `Hola, quiero enviar mi comprobante para comprar “${book.title}” por ${money(book.price)}.`
  );

  return (
    <main>
      <SiteHeader onHome={onBack} showBackButton onBack={onBack} />

      <section className="detail-layout">
        <div className="detail-cover">
          <Cover book={book} featured />
        </div>

        <article className="detail-copy">
          <p className="eyebrow">{book.category}</p>
          <h1>{book.title}</h1>
          <h2>{book.author}</h2>
          <p className="description">{book.description}</p>
          <dl>
            <div>
              <dt>Formato</dt>
              <dd>{book.format}</dd>
            </div>
            <div>
              <dt>Páginas</dt>
              <dd>{book.pages}</dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{book.isbn}</dd>
            </div>
          </dl>
        </article>

        <aside className="purchase-card">
          <p className="stock">
            ● {book.stock > 0 ? `${book.stock} disponibles` : 'Sin existencias'}
          </p>
          <strong className="price">{money(book.price)}</strong>
          <p className="delivery">⌁ {book.delivery}</p>
          <a
            className="paypal-button"
            href={paypalPaymentUrl}
            target="_blank"
            rel="noreferrer"
          >
            Pagar con <b>PayPal</b>
          </a>
          <div className="divider">
            <span>o</span>
          </div>
          <a
            className="oxxo-button"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
          >
            Comprar por depósito en OXXO
          </a>
          <p className="payment-note">
            Al realizar su depósito, envíe una foto del comprobante por WhatsApp al{' '}
            <strong>477 137 6775</strong>. Le confirmaremos los datos de envío personalmente.
          </p>
        </aside>
      </section>

      <section className="purchase-steps">
        <p className="eyebrow">Comprar es sencillo</p>
        <div>
          <span>01</span>
          <p>Elija su forma de pago.</p>
          <span>02</span>
          <p>Comparta sus datos de envío.</p>
          <span>03</span>
          <p>Reciba confirmación y seguimiento.</p>
        </div>
      </section>
    </main>
  );
}

export default App;