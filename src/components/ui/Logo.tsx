import iconeUrl from '../../assets/icone.svg';
import styles from './Logo.module.css';

export interface LogoProps {
  taille?: 'm' | 'l';
  /** Pour les fonds bleu nuit : le mot passe en couleur claire. */
  surfaceSombre?: boolean;
}

/** Logo : icône « branches » + le mot « branchés » en Nunito 900, couleur bleu profond. */
export function Logo({ taille = 'm', surfaceSombre = false }: LogoProps) {
  return (
    <span className={`${styles.logo} ${styles[taille]} ${surfaceSombre ? styles.sombre : ''}`}>
      <img src={iconeUrl} alt="" className={styles.icone} />
      <span className={styles.mot}>branchés</span>
    </span>
  );
}
