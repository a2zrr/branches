import { useEffect, useState } from 'react';

/** Vrai sous la largeur donnée (en px). Faux si matchMedia n'existe pas (tests). */
export function useEcranEtroit(largeur: number): boolean {
  const requete = `(max-width: ${largeur - 1}px)`;
  const [etroit, setEtroit] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(requete).matches
      : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(requete);
    const changer = () => {
      setEtroit(media.matches);
    };
    media.addEventListener('change', changer);
    return () => {
      media.removeEventListener('change', changer);
    };
  }, [requete]);
  return etroit;
}
