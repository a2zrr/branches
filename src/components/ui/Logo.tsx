import iconeUrl from '../../assets/icone.svg';
import styles from './Logo.module.css';

export interface LogoProps {
  taille?: 'm' | 'l';
}

/** Logo : icône « branches » + le mot « branchés » en Nunito 900, couleur bleu profond. */
export function Logo({ taille = 'm' }: LogoProps) {
  return (
    <span className={`${styles.logo} ${styles[taille]}`}>
      <img src={iconeUrl} alt="" className={styles.icone} />
      <span className={styles.mot}>branchés</span>
    </span>
  );
}
