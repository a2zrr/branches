import { Link } from 'react-router';
import { Logo } from './Logo';
import { useInterface } from '../../game/ui';
import styles from './PiedPage.module.css';

/** Pied de page bleu nuit, précédé d'une vague. Il ne contient que des liens vers des pages qui existent. */
export function PiedPage() {
  const ouvrirParametres = useInterface((s) => s.ouvrirParametres);
  return (
    <footer className={styles.pied}>
      <svg
        className={styles.vague}
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M0 60 C 240 0, 480 0, 720 30 S 1200 60, 1440 10 L1440 60 Z"
          style={{ fill: 'var(--color-night)' }}
        />
      </svg>
      <div className={styles.fond}>
        <div className={`conteneur ${styles.contenu}`}>
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
                <button type="button" className={styles.lien} onClick={ouvrirParametres}>
                  Paramètres
                </button>
              </div>
            </nav>
          </div>
          <div className={styles.bas}>
            <span>© 2026 Branchés</span>
            <span>Interface en français · commandes Git en anglais, comme en vrai</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
