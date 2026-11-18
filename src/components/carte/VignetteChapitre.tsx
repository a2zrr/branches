import { Mascotte } from '../mascotte/Mascotte';
import { FORMES_PAR_TEINTE, type FormeVignette } from './vignettesFormes';
import type { ChapitreValide } from '../../game/schemas';
import styles from './VignetteChapitre.module.css';

export type Vignette = NonNullable<ChapitreValide['vignette']>;

export interface VignetteChapitreProps {
  vignette: Vignette;
  /** Côté du carré, en px. Les dessins sont en coordonnées 300 et mis à l'échelle. */
  taille: number;
}

/** Taille de Hédi dans le rond, pour une vignette de 300 px (190 px dans la maquette). */
const HEDI_SUR_300 = 190;

/**
 * Vignette d'un chapitre (spec § 9 bis, « La vignette ») : Hédi dans un rond pastel, les formes des
 * branches qui flottent autour, et un accessoire de l'interface posé sur le bord. Décorative.
 */
export function VignetteChapitre({ vignette, taille }: VignetteChapitreProps) {
  const echelle = taille / 300;
  const formes = FORMES_PAR_TEINTE[vignette.teinte];

  return (
    <div
      className={styles.boite}
      style={{ width: taille, height: taille }}
      aria-hidden="true"
      data-vignette={vignette.teinte}
    >
      <div className={styles.plan} style={{ transform: `scale(${echelle})` }}>
        <div className={styles.rond} style={{ background: `var(--vignette-${vignette.teinte})` }} />
        <svg className={styles.formes} viewBox="0 0 300 300" focusable="false">
          {formes.map((f, i) => (
            <FormeBranche key={i} forme={f} />
          ))}
        </svg>
        <div className={styles.flotte}>
          <Mascotte expression={vignette.expression} taille={HEDI_SUR_300} anime={false} />
        </div>
        <Accessoire nom={vignette.accessoire} />
      </div>
    </div>
  );
}

function FormeBranche({ forme }: { forme: FormeVignette }) {
  const style = {
    fill: `var(--branch-${forme.couleur})`,
    stroke: `var(--branch-${forme.couleur}-edge)`,
  };
  if (forme.type === 'rond') {
    return (
      <circle
        className={styles[forme.classe]}
        cx={forme.cx}
        cy={forme.cy}
        r={forme.r}
        strokeWidth={3}
        style={style}
      />
    );
  }
  return (
    <path
      className={styles[forme.classe]}
      d={forme.d}
      strokeWidth={3}
      strokeLinejoin="round"
      style={style}
    />
  );
}

function Accessoire({ nom }: { nom: Vignette['accessoire'] }) {
  if (nom === 'terminal') {
    return (
      <div className={styles.terminal}>
        <div>
          <span className={styles.invite}>$</span> npm run demo
        </div>
        <div className={styles.erreur}>✗ 3 tests en échec</div>
      </div>
    );
  }
  if (nom === 'message') {
    return (
      <div className={styles.message}>
        <span className={styles.pastilleK}>K</span>
        <span className={styles.messageTexte}>
          <span className={styles.nom}>Kévin</span>
          <strong>J’ai poussé sur main !</strong>
        </span>
      </div>
    );
  }
  return (
    <div className={styles.calendrier}>
      <div className={styles.bandeau}>VEN.</div>
      <div className={styles.heure}>17:00</div>
    </div>
  );
}
