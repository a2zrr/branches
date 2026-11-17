import { Link } from 'react-router';
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
}

/** En-tête commun : logo, compteurs, bouton Paramètres (icône). Il n'y a pas de compte. */
export function EnTeteAppli({ notionsMaitrisees, notionsTotal, xp, etoiles }: EnTeteAppliProps) {
  return (
    <header className={styles.entete}>
      <Link to="/" className={styles.logo} aria-label="Branchés, accueil">
        <Logo />
      </Link>
      <div className={styles.outils}>
        <Compteur type="notions" valeur={notionsMaitrisees} total={notionsTotal} />
        {etoiles !== undefined && <Compteur type="etoiles" valeur={etoiles.valeur} />}
        <Compteur type="xp" valeur={xp} />
        <Link to="/parametres" className={styles.parametres} aria-label="Paramètres">
          <Icone nom="engrenage" taille={22} trait={2.4} couleur="var(--color-text)" />
        </Link>
      </div>
    </header>
  );
}
