import { Icone, type NomIcone } from '../ui/Icone';
import styles from './BarreMission.module.css';

export interface BarreMissionProps {
  numero: number;
  titre: string;
  /** Mission terminée : le bouton propose de la rejouer. */
  terminee: boolean;
  /** Mission à jouer ou à rejouer ; absent quand il n'y a plus rien à jouer. */
  onJouer?: () => void;
}

/** Barre fixe en bas de la carte sur téléphone : la mission choisie, et COMMENCER ou REJOUER. */
export function BarreMission({ numero, titre, terminee, onJouer }: BarreMissionProps) {
  const icone: NomIcone = terminee ? 'coche' : 'terminal';
  return (
    <section className={styles.barre} aria-label="Mission choisie">
      <span className={styles.pastille} aria-hidden="true">
        <Icone nom={icone} taille={22} trait={2.8} couleur="var(--color-on-primary)" />
      </span>
      <div className={styles.textes}>
        <span className={styles.numero}>Mission {numero}</span>
        <span className={styles.titre}>{titre}</span>
      </div>
      {onJouer !== undefined && (
        <button type="button" className={styles.action} onClick={onJouer}>
          {terminee ? 'Rejouer' : 'Commencer'}
        </button>
      )}
    </section>
  );
}
