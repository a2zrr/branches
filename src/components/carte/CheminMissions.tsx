import { courbe, decalage, type Mesures } from './geometrie';
import styles from './CheminMissions.module.css';

export interface CheminMissionsProps {
  mesures: Mesures;
  /** Nombre de missions du chapitre. */
  nombre: number;
  /** Index de la mission en cours (ou de la dernière si tout est fini). */
  indexCourant: number;
  /** Couleur de la partie faite (variable CSS, ex. var(--chemin-bleu)). */
  couleurFaite: string;
  /** Si un mur suit le chapitre : le chemin à venir s'enfonce jusqu'à cette hauteur. */
  hauteurSousMur?: number;
  /** Hauteur totale de la zone du chapitre. */
  hauteur: number;
  /** Ouverture d'un chapitre : le trait « faits » se trace (attente = invisible, joue = tracé). */
  trace?: 'attente' | 'joue';
}

/**
 * Le chemin entre les pastilles : deux traits pleins. Partie faite en couleur de teinte,
 * partie à venir en gris. Positions relatives au centre de la zone (x = 0 au milieu).
 */
export function CheminMissions({
  mesures,
  nombre,
  indexCourant,
  couleurFaite,
  hauteurSousMur,
  hauteur,
  trace,
}: CheminMissionsProps) {
  const centres = Array.from({ length: nombre }, (_, i) => {
    const y = mesures.haut + i * mesures.rang + mesures.aire / 2;
    return [decalage(mesures, i), y] as [number, number];
  });
  const k = Math.min(Math.max(indexCourant, 0), Math.max(nombre - 1, 0));
  const faite: [number, number][] = [[0, 0], ...centres.slice(0, k + 1)];
  const aVenir: [number, number][] = centres.slice(k);
  if (hauteurSousMur !== undefined) aVenir.push([0, hauteurSousMur]);

  return (
    <svg
      className="chemin-missions"
      aria-hidden="true"
      focusable="false"
      width="2"
      height={hauteur}
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {aVenir.length > 1 && (
        <path
          d={courbe(aVenir)}
          fill="none"
          stroke="var(--chemin-a-venir)"
          strokeWidth={mesures.traitChemin}
          strokeLinecap="round"
        />
      )}
      {faite.length > 1 && (
        <path
          d={courbe(faite)}
          fill="none"
          stroke={couleurFaite}
          strokeWidth={mesures.traitChemin}
          strokeLinecap="round"
          {...(trace !== undefined ? { pathLength: 1 } : {})}
          className={trace === 'attente' ? styles.attente : trace === 'joue' ? styles.trace : undefined}
        />
      )}
    </svg>
  );
}
