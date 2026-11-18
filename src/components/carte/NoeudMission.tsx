import { Icone, type NomIcone } from '../ui/Icone';
import { PopoverMission } from '../ui/PopoverMission';
import type { Mesures } from './geometrie';
import styles from './NoeudMission.module.css';

export type EtatNoeud = 'terminee' | 'en-cours' | 'disponible' | 'verrouillee' | 'brouillon';

export interface NoeudMissionProps {
  mesures: Mesures;
  numero: number;
  titre: string;
  etat: EtatNoeud;
  etoiles: 0 | 1 | 2 | 3;
  /** Décalage horizontal dans le zigzag (px). */
  dx: number;
  /** Haut du bloc, relatif à la zone du chapitre (px). */
  top: number;
  onCommencer: () => void;
}

const ICONE: Record<EtatNoeud, NomIcone> = {
  terminee: 'coche',
  'en-cours': 'terminal',
  disponible: 'lecture',
  verrouillee: 'cadenas',
  brouillon: 'horloge',
};

const LIBELLE: Record<EtatNoeud, string> = {
  terminee: 'terminée',
  'en-cours': 'en cours',
  disponible: 'disponible',
  verrouillee: 'verrouillée',
  brouillon: 'bientôt disponible',
};

/**
 * Une mission sur la carte : pastille, titre à côté (PC), étoiles ou « BIENTÔT » au-dessus du titre.
 * La mission en cours n'a pas de titre : son popover s'ouvre du même côté que les titres.
 */
export function NoeudMission({ mesures, numero, titre, etat, etoiles, dx, top, onCommencer }: NoeudMissionProps) {
  const adroite = dx >= 0;
  const enCours = etat === 'en-cours';
  const taille = enCours ? mesures.pastilleEnCours : mesures.pastille;
  const cliquable = etat !== 'verrouillee' && etat !== 'brouillon';
  const verrouille = etat === 'verrouillee' || etat === 'brouillon';
  const libelleEtoiles = etat === 'terminee' ? `, ${etoiles} étoile${etoiles > 1 ? 's' : ''}` : '';

  return (
    <div
      className={styles.noeud}
      data-etat={etat}
      style={{
        top,
        left: `calc(50% + ${dx - mesures.aire / 2}px)`,
        width: mesures.aire,
        height: mesures.aire,
      }}
    >
      {enCours && (
        <>
          <span className={styles.anneau} aria-hidden="true" />
          <PopoverMission
            numero={numero}
            titre={titre}
            cote={adroite ? 'droite' : 'gauche'}
            onCommencer={onCommencer}
          />
        </>
      )}
      <button
        type="button"
        className={`${styles.pastille} ${styles[etat.replace('-', '')] ?? ''}`}
        style={{ width: taille, height: taille }}
        disabled={!cliquable}
        aria-label={`Mission ${numero}, ${titre}, ${LIBELLE[etat]}${libelleEtoiles}`}
        onClick={cliquable ? onCommencer : undefined}
      >
        <Icone
          nom={ICONE[etat]}
          taille={32}
          trait={2.8}
          couleur={
            etat === 'verrouillee'
              ? 'var(--color-disabled-text)'
              : etat === 'brouillon'
                ? 'var(--color-disabled-text)'
                : etat === 'terminee'
                  ? 'var(--color-text)'
                  : 'var(--color-on-primary)'
          }
        />
      </button>
      {!enCours && (
        <div className={`${styles.legende} ${adroite ? styles.adroite : styles.agauche}`} aria-hidden="true">
          {etat === 'terminee' && (
            <span className={styles.etoiles}>
              {[1, 2, 3].map((n) => (
                <Icone
                  key={n}
                  nom="etoile"
                  taille={17}
                  trait={1.5}
                  remplie
                  couleur={n <= etoiles ? 'var(--color-hint)' : 'var(--color-border)'}
                />
              ))}
            </span>
          )}
          {etat === 'brouillon' && <span className={styles.bientot}>Bientôt</span>}
          <span className={`${styles.titre} ${verrouille ? styles.titreMuet : ''}`}>{titre}</span>
        </div>
      )}
    </div>
  );
}
