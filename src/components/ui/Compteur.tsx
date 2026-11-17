import { Icone } from './Icone';
import styles from './Compteur.module.css';

export interface CompteurProps {
  type: 'notions' | 'xp' | 'etoiles';
  valeur: number;
  total?: number;
}

/** Compteur en pastille blanche, bordure 2 px : notions (cadre terminal), XP (éclair), étoiles. */
export function Compteur({ type, valeur, total }: CompteurProps) {
  if (type === 'notions') {
    return (
      <span className={`${styles.compteur} ${styles.notions}`}>
        <Icone nom="cadreTerminal" taille={20} trait={2.6} couleur="var(--color-primary)" />
        <span className={styles.nombre}>
          {valeur} / {total ?? 0}
        </span>
      </span>
    );
  }
  if (type === 'xp') {
    return (
      <span className={`${styles.compteur} ${styles.xp}`}>
        <Icone nom="eclair" taille={20} trait={2} remplie couleur="var(--color-hint)" />
        <span className={styles.nombre}>{valeur} XP</span>
      </span>
    );
  }
  return (
    <span className={`${styles.compteur} ${styles.etoiles}`}>
      <Icone nom="etoile" taille={20} trait={1.5} remplie couleur="var(--color-hint)" />
      <span className={styles.nombre}>{valeur}</span>
    </span>
  );
}
