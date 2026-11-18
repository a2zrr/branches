import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { FenetreParametres } from './components/parametres/FenetreParametres';
import { routeur } from './routes';
import { useProgression } from './game/store';

export function App() {
  const theme = useProgression((etat) => etat.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <RouterProvider router={routeur} />
      <FenetreParametres />
    </>
  );
}
