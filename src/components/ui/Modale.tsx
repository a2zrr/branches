import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Bouton } from './Bouton';
import styles from './Modale.module.css';

export interface ModaleProps {
  titre: string;
  children: ReactNode;
  libelleConfirmer: string;
  libelleAnnuler?: string;
  variante?: 'primaire' | 'danger';
  onConfirmer: () => void;
  onAnnuler: () => void;
}

/** Fenêtre de confirmation. Échap annule, le focus est mis sur le bouton « Annuler ». */
export function Modale({
  titre,
  children,
  libelleConfirmer,
  libelleAnnuler = 'Annuler',
  variante = 'primaire',
  onConfirmer,
  onAnnuler,
}: ModaleProps) {
  const idTitre = useId();
  const annulerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    annulerRef.current?.focus();
    const gestion = (evenement: KeyboardEvent) => {
      if (evenement.key === 'Escape') onAnnuler();
    };
    window.addEventListener('keydown', gestion);
    return () => {
      window.removeEventListener('keydown', gestion);
    };
  }, [onAnnuler]);

  return (
    <div className={styles.conteneur}>
      <div className={styles.voile} aria-hidden="true" />
      <div className={styles.boite} role="dialog" aria-modal="true" aria-labelledby={idTitre}>
        <h2 id={idTitre} className={styles.titre}>
          {titre}
        </h2>
        <div className={styles.corps}>{children}</div>
        <div className={styles.actions}>
          <button ref={annulerRef} type="button" className={styles.annuler} onClick={onAnnuler}>
            {libelleAnnuler}
          </button>
          <Bouton variante={variante} onClick={onConfirmer}>
            {libelleConfirmer}
          </Bouton>
        </div>
      </div>
    </div>
  );
}
