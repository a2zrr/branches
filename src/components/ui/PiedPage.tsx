import { Link } from 'react-router';
import { Logo } from './Logo';
import styles from './PiedPage.module.css';

/** Pied de page bleu nuit. Il ne contient que des liens vers des pages qui existent. */
export function PiedPage() {
  return (
    <footer className={styles.pied}>
      <div className={styles.haut}>
        <div className={styles.marque}>
          <Logo taille="l" surfaceSombre />
          <p className={styles.accroche}>Git s’apprend mieux quand main est en feu.</p>
        </div>
        <nav aria-label="Liens du pied de page" className={styles.liens}>
          <div>
            <h3 className={styles.titre}>Le jeu</h3>
            <Link to="/carte" className={styles.lien}>
              Carte des missions
            </Link>
          </div>
          <div>
            <h3 className={styles.titre}>Réglages</h3>
            <Link to="/parametres" className={styles.lien}>
              Paramètres
            </Link>
          </div>
        </nav>
      </div>
      <p className={styles.bas}>
        <span>© 2026 Branchés</span> ·{' '}
        <span>Interface en français, commandes Git en anglais, comme en vrai.</span>
      </p>
    </footer>
  );
}
