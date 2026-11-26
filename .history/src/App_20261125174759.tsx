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
          <span className="brand-text">
            <strong>Los libros de la buena memoria</strong>
            <small>Búsqueda y envío a domicilio</small>
          </span>
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
              <a href="#catalogo" className="nav-link" onClick={handleNavClick}>
                Catálogo
              </a>
              <a href="#book-search" className="nav-link" onClick={handleNavClick}>
                Buscar título
              </a>
            </>
          )}
          <a