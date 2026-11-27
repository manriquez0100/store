import { useEffect, useState } from 'react';

export function CatalogReach({ total }: { total: number | null }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (total === null) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const endImmediately = () => { cancelAnimationFrame(frame); setValue(total); };
    if (preference.matches) { setValue(total); return; }
    setValue(0);
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / 2200, 1);
      setValue(Math.floor(total * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    preference.addEventListener('change', endImmediately);
    frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener('change', endImmediately); };
  }, [total]);
  if (total === null) return <p className="reach-loading">Conectando con nuestro catálogo de libros…</p>;
  const formatted = value.toLocaleString('es-MX');
  const target = total.toLocaleString('es-MX');
  return <section className="catalog-reach" aria-label={`Encuentra tu libro entre más de ${target} títulos alrededor de todo el mundo.`}>
    <p aria-hidden="true">Encuentra tu libro entre más de</p>
    <div className="reach-total" aria-hidden="true"><span className="rolling-number">{formatted.split('').map((character, index) => /\d/.test(character)
      ? <span className="reel-window" key={index}><span className="reel-track" style={{ transform: `translateY(-${Number(character)}em)` }}>{Array.from({ length: 10 }, (_, digit) => <span key={digit}>{digit}</span>)}</span></span>
      : <span className="reel-separator" key={index}>{character}</span>)}</span><span className="reach-unit">títulos</span></div>
    <p aria-hidden="true">alrededor de todo el mundo.</p>
  </section>;
}
