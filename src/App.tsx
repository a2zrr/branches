import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { FenetreParametres } from './components/parametres/FenetreParametres';
import { routeur } from './routes';
import { useProgression } from './game/store';

const REQUETE_SOMBRE = '(prefers-color-scheme: dark)';

export function App() {
  const theme = useProgression((etat) => etat.theme);

  // « auto » suit le système et réagit à son changement ; le CSS ne connaît que clair et sombre.
  useEffect(() => {
    const racine = document.documentElement;
    const requete = typeof window.matchMedia === 'function' ? window.matchMedia(REQUETE_SOMBRE) : null;
    const appliquer = () => {
      const sombre = theme === 'sombre' || (theme === 'auto' && requete?.matches === true);
      racine.setAttribute('data-theme', sombre ? 'sombre' : 'clair');
    };
    appliquer();
    if (theme !== 'auto' || requete === null) return;
    requete.addEventListener('change', appliquer);
    return () => {
      requete.removeEventListener('change', appliquer);
    };
  }, [theme]);

  return (
    <>
      <RouterProvider router={routeur} />
      <FenetreParametres />
    </>
  );
}
