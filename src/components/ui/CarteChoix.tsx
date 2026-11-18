import type { ReactNode } from 'react';
import styles from './CarteChoix.module.css';

export interface CarteChoixProps {
  raccourci: number | string;
  titre: string;
  description?: ReactNode;
  selectionnee: boolean;
  desactivee?: boolean;
  onSelect: () => void;
  /** Aperçu du code affiché sous la description (maquette Conflit.png). */
  apercu?: ReactNode;
  /** Présentation en ligne : raccourci, titre et description sur une seule ligne. */
  pleineLigne?: boolean;
  /** Aperçu d'un état (page design system) : « survol » ou « focus » forcé. */
  etatApercu?: 'survol' | 'focus';
}

export function CarteChoix({
  raccourci,
  titre,
  description,
  selectionnee,
  desactivee = false,
  onSelect,
  apercu,
  pleineLigne = false,
  etatApercu,
}: CarteChoixProps) {
  return (
    <button
      type="button"
      className={`${styles.carte} ${pleineLigne ? styles.ligne : ''}`}
      aria-pressed={selectionnee}
      disabled={desactivee}
      data-selectionnee={selectionnee || undefined}
      data-etat={etatApercu}
      onClick={onSelect}
    >
      <span className={styles.raccourci} aria-hidden="true">
        {raccourci}
      </span>
      <span className={styles.textes}>
        <strong className={styles.titre}>{titre}</strong>
        {description !== undefined && <span className={styles.description}>{description}</span>}
      </span>
      {apercu !== undefined && <span className={styles.apercu}>{apercu}</span>}
    </button>
  );
}
