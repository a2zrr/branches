import type { ReactNode } from 'react';
import styles from './CarteChoix.module.css';

export interface CarteChoixProps {
  raccourci: number | string;
  titre: string;
  description?: ReactNode;
  selectionnee: boolean;
  desactivee?: boolean;
  onSelect: () => void;
}

export function CarteChoix({
  raccourci,
  titre,
  description,
  selectionnee,
  desactivee = false,
  onSelect,
}: CarteChoixProps) {
  return (
    <button
      type="button"
      className={styles.carte}
      aria-pressed={selectionnee}
      disabled={desactivee}
      data-selectionnee={selectionnee || undefined}
      onClick={onSelect}
    >
      <span className={styles.raccourci} aria-hidden="true">
        {raccourci}
      </span>
      <strong className={styles.titre}>{titre}</strong>
      {description !== undefined && <span className={styles.description}>{description}</span>}
    </button>
  );
}
