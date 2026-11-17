import { useProgression } from '../game/store';

export function Parametres() {
  const theme = useProgression((etat) => etat.theme);
  const definirTheme = useProgression((etat) => etat.definirTheme);

  return (
    <main>
      <h1>Paramètres</h1>
      <button
        type="button"
        onClick={() => {
          definirTheme(theme === 'clair' ? 'sombre' : 'clair');
        }}
      >
        {theme === 'clair' ? 'Passer en mode sombre' : 'Passer en mode clair'}
      </button>
    </main>
  );
}
