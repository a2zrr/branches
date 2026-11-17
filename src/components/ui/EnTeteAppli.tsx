import { Link } from 'react-router';
import { useProgression } from '../../game/store';
import { Compteur } from './Compteur';
import { Icone } from './Icone';
import { Logo } from './Logo';
import styles from './EnTeteAppli.module.css';

export interface EnTeteAppliProps {
  notionsMaitrisees: number;
  notionsTotal: number;
  xp: number;
  /** Compteur d'étoiles affiché (carte uniquement). */
  etoiles?: { valeur: number };
  /** « accueil » : XP et roue. « carte » : étoiles, XP et bouton thème. */
  variante?: 'accueil' | 'carte';
}

/** Bouton lune : bascule le thème clair / sombre. */
function BoutonTheme() {
  const theme = useProgression((s) => s.theme);
  const definirTheme = useProgression((s) => s.definirTheme);
  const sombre = theme === 'sombre';
  return (
    <button
      type="button"
      className={styles.parametres}
      aria-pressed={sombre}
      aria-label={sombre ? 'Passer en mode clair' : 'Passer en mode sombre'}
      onClick={() => {
        definirTheme(sombre ? 'clair' : 'sombre');
      }}
    >
      <Icone nom="lune" taille={24} trait={2.4} couleur="var(--color-text)" />
    </button>
  );
}

/** En-tête commun : logo, compteurs en pastilles, bouton Paramètres (roue dentée). Il n'y a pas de compte. */
export function EnTeteAppli({
  notionsMaitrisees,
  notionsTotal,
  xp,
  etoiles,
  variante = 'accueil',
}: EnTeteAppliProps) {
  return (
    <header className={styles.entete}>
      <div className={`conteneur ${styles.interieur}`}>
        <Link to="/" className={styles.logo} aria-label="Branchés, accueil">
          <Logo />
        </Link>
        <div className={styles.outils}>
          <Compteur type="notions" valeur={notionsMaitrisees} total={notionsTotal} />
          {variante === 'carte' && etoiles !== undefined ? (
            <>
              <Compteur type="etoiles" valeur={etoiles.valeur} />
              <Compteur type="xp" valeur={xp} />
              <BoutonTheme />
            </>
          ) : (
            <>
              <Compteur type="xp" valeur={xp} />
              <Link to="/parametres" className={styles.parametres} aria-label="Paramètres">
                <Icone nom="roue" taille={24} trait={2.4} couleur="var(--color-text)" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
