import { Icone } from './Icone';
import styles from './Compteur.module.css';

export interface CompteurProps {
  type: 'notions' | 'xp' | 'etoiles';
  valeur: number;
  total?: number;
}

export function Compteur({ type, valeur, total }: CompteurProps) {
  if (type === 'notions') {
    return (
      <span className={`${styles.compteur} ${styles.notions}`}>
        <Icone nom="etiquette" taille={18} trait={2.4} />
        <span className={styles.nombre}>
          {valeur} / {total ?? 0}
        </span>
        <span className={styles.unite}>notions</span>
      </span>
    );
  }
  if (type === 'xp') {
    return (
      <span className={`${styles.compteur} ${styles.xp}`}>
        <span className={styles.nombre}>{valeur} XP</span>
      </span>
    );
  }
  return (
    <span className={`${styles.compteur} ${styles.etoiles}`}>
      <Icone nom="etoile" taille={18} trait={1.5} remplie couleur="var(--color-hint)" />
      <span className={styles.nombre}>
        {valeur}
        {total !== undefined && ` / ${total}`}
      </span>
    </span>
  );
}
