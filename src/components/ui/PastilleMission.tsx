import { Icone, type NomIcone } from './Icone';
import { PopoverMission } from './PopoverMission';
import styles from './PastilleMission.module.css';

export type EtatPastille = 'verrouillee' | 'disponible' | 'en-cours' | 'terminee';

export interface PastilleMissionProps {
  etat: EtatPastille;
  etoiles: 0 | 1 | 2 | 3;
  numero: number;
  titre: string;
  decalage?: number;
  onClick?: () => void;
}

const ICONE: Record<EtatPastille, NomIcone> = {
  verrouillee: 'cadenas',
  disponible: 'lecture',
  'en-cours': 'terminal',
  terminee: 'coche',
};

const LIBELLE_ETAT: Record<EtatPastille, string> = {
  verrouillee: 'verrouillée',
  disponible: 'disponible',
  'en-cours': 'en cours',
  terminee: 'terminée',
};

export function PastilleMission({
  etat,
  etoiles,
  numero,
  titre,
  decalage = 0,
  onClick,
}: PastilleMissionProps) {
  const cliquable = etat !== 'verrouillee';
  return (
    <div className={styles.colonne} style={{ transform: `translateX(${decalage}px)` }}>
      {etat === 'en-cours' && (
        <>
          <span className={styles.anneau} aria-hidden="true" />
          <PopoverMission
            numero={numero}
            titre={titre}
            cote={decalage > 0 ? 'gauche' : 'droite'}
            onCommencer={() => onClick?.()}
          />
        </>
      )}
      <button
        type="button"
        className={`${styles.pastille} ${styles[etat.replace('-', '')] ?? ''}`}
        disabled={!cliquable}
        aria-label={`Mission ${numero}, ${titre}, ${LIBELLE_ETAT[etat]}${etat === 'terminee' ? `, ${etoiles} étoile${etoiles > 1 ? 's' : ''}` : ''}`}
        onClick={onClick}
      >
        <Icone
          nom={ICONE[etat]}
          taille={32}
          trait={2.8}
          couleur={
            etat === 'verrouillee'
              ? 'var(--color-disabled-text)'
              : etat === 'terminee'
                ? 'var(--color-text)'
                : 'var(--color-on-primary)'
          }
        />
      </button>
      <span className={styles.etoiles} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <Icone
            key={n}
            nom="etoile"
            taille={18}
            trait={1.5}
            remplie
            couleur={n <= etoiles ? 'var(--color-hint)' : 'var(--color-border)'}
          />
        ))}
      </span>
      <span className={styles.titre}>{titre}</span>
    </div>
  );
}
