import { Mascotte } from '../mascotte/Mascotte';
import { Bouton } from './Bouton';
import styles from './PanneauIndice.module.css';

export interface PanneauIndiceProps {
  indices: string[];
  /** Nombre d'indices déjà révélés. */
  index: number;
  onSuivant: () => void;
  onFermer: () => void;
}

/** Hédi pensif ; les indices se révèlent un par un. Ils ne changent pas les étoiles. */
export function PanneauIndice({ indices, index, onSuivant, onFermer }: PanneauIndiceProps) {
  const revele = indices.slice(0, index);
  const restants = indices.length - index;
  return (
    <div className={styles.fond}>
      <div className={styles.panneau} role="dialog" aria-modal="true" aria-label="Indice">
        <div className={styles.entete}>
          <Mascotte expression="pensif" taille={84} />
          <div className={styles.textes}>
            <span className={styles.titre}>
              Indice {index} sur {indices.length}
            </span>
            <p className={styles.note}>Les indices ne changent pas le nombre d’étoiles.</p>
          </div>
        </div>
        <ol className={styles.liste}>
          {revele.map((texte, i) => (
            <li key={i} className={styles.indice}>
              {texte}
            </li>
          ))}
        </ol>
        {revele.length === 0 && <p className={styles.note}>Aucun indice révélé pour l’instant.</p>}
        <div className={styles.actions}>
          <Bouton variante="secondaire" onClick={onFermer}>
            Fermer
          </Bouton>
          {restants > 0 && (
            <Bouton variante="indice" onClick={onSuivant}>
              Révéler un indice
            </Bouton>
          )}
        </div>
      </div>
    </div>
  );
}
