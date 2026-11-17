import styles from './PopoverMission.module.css';

export interface PopoverMissionProps {
  numero: number;
  titre: string;
  onCommencer: () => void;
}

export function PopoverMission({ numero, titre, onCommencer }: PopoverMissionProps) {
  return (
    <div className={styles.popover} role="group" aria-label={`Mission ${numero}`}>
      <span className={styles.numero}>Mission {numero}</span>
      <span className={styles.titre}>{titre}</span>
      <button type="button" className={styles.commencer} onClick={onCommencer}>
        Commencer
      </button>
    </div>
  );
}
