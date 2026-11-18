import { useEffect, useState } from 'react';
import { MESURES_PC, MESURES_TEL, type Mesures } from './geometrie';

const REQUETE_PC = '(min-width: 1024px)';

/** Mesures de la carte selon la largeur : PC à partir de 1 024 px, téléphone sinon. */
export function useMesures(): Mesures {
  const [pc, setPc] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
    return window.matchMedia(REQUETE_PC).matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const requete = window.matchMedia(REQUETE_PC);
    const changer = () => {
      setPc(requete.matches);
    };
    requete.addEventListener('change', changer);
    return () => {
      requete.removeEventListener('change', changer);
    };
  }, []);
  return pc ? MESURES_PC : MESURES_TEL;
}
