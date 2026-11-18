import { Link } from 'react-router';
import { useInterface } from '../../game/ui';
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
  /** « accueil » : XP et roue. « carte » : étoiles, XP et roue. */
  variante?: 'accueil' | 'carte';
}

/** Roue dentée : ouvre le panneau Paramètres sur la page en cours. */
function BoutonParametres() {
  const ouvrir = useInterface((s) => s.ouvrirParametres);
  return (
    <button
      type="button"
      id="bouton-parametres"
      className={styles.parametres}
      aria-label="Paramètres"
      onClick={ouvrir}
    >
      <Icone nom="roue" taille={24} trait={2.4} couleur="var(--color-text)" />
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
      <div className={styles.interieur}>
        <Link to="/" className={styles.logo} aria-label="Branchés, accueil">
          <Logo />
        </Link>
        <div className={styles.outils}>
          <Compteur type="notions" valeur={notionsMaitrisees} total={notionsTotal} />
          {variante === 'carte' && etoiles !== undefined ? (
            <>
              <Compteur type="etoiles" valeur={etoiles.valeur} />
              <Compteur type="xp" valeur={xp} />
              <BoutonParametres />
            </>
          ) : (
            <>
              <Compteur type="xp" valeur={xp} />
              <BoutonParametres />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
