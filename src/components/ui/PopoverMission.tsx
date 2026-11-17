import styles from './PopoverMission.module.css';

export interface PopoverMissionProps {
  numero: number;
  titre: string;
  onCommencer: () => void;
}

/** Carte bleue au-dessus de la mission en cours : numéro, titre et COMMENCER (maquette Carte.png). */
export function PopoverMission({ numero, titre, onCommencer }: PopoverMissionProps) {
  return (
    <div className={styles.popover} role="group" aria-label={`Mission ${numero}`}>
      <span className={styles.numero}>Mission {numero}</span>
      <strong className={styles.titre}>{titre}</strong>
      <button type="button" className={styles.commencer} onClick={onCommencer}>
        Commencer
      </button>
    </div>
  );
}
