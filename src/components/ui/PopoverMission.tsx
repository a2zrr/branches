import styles from './PopoverMission.module.css';

export interface PopoverMissionProps {
  numero: number;
  titre: string;
  /** Côté de la pastille où le popover s'ouvre : « droite » ou « gauche ». */
  cote: 'droite' | 'gauche';
  onCommencer: () => void;
}

/** Carte bleue à côté de la mission en cours : numéro, titre et COMMENCER (maquette Carte.png). */
export function PopoverMission({ numero, titre, cote, onCommencer }: PopoverMissionProps) {
  return (
    <div
      className={`${styles.popover} ${cote === 'droite' ? styles.droite : styles.gauche}`}
      role="group"
      aria-label={`Mission ${numero}`}
    >
      <span className={styles.pointe} aria-hidden="true" />
      <span className={styles.numero}>Mission {numero}</span>
      <strong className={styles.titre}>{titre}</strong>
      <button type="button" className={styles.commencer} onClick={onCommencer}>
        Commencer
      </button>
    </div>
  );
}
