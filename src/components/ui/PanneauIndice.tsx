import { Mascotte } from '../mascotte/Mascotte';
import { Bouton } from './Bouton';
import styles from './PanneauIndice.module.css';

export interface PanneauIndiceProps {
  indices: string[];
  /** Nombre d'indices déjà révélés (au moins 1 à l'ouverture). */
  index: number;
  onSuivant: () => void;
  onFermer: () => void;
}

/**
 * Carte jaune ancrée sous le bouton INDICE (maquette JeuTerminalIndice.png) : Hédi pensif,
 * le dernier indice révélé, et les boutons INDICE SUIVANT / OK, J'ESSAIE. Pas de voile : le jeu reste visible.
 */
export function PanneauIndice({ indices, index, onSuivant, onFermer }: PanneauIndiceProps) {
  const courant = indices[Math.max(0, index - 1)] ?? '';
  const restants = indices.length - index;
  return (
    <div className={styles.panneau} role="dialog" aria-label="Indice">
      <Mascotte expression="pensif" taille={84} />
      <div className={styles.corps}>
        <span className={styles.etiquette}>
          Indice {index} sur {indices.length}
        </span>
        <p className={styles.texte}>{courant}</p>
        <p className={styles.note}>Les indices ne changent pas le nombre d’étoiles.</p>
        <div className={styles.actions}>
          {restants > 0 && (
            <Bouton variante="secondaire" onClick={onSuivant}>
              Indice suivant
            </Bouton>
          )}
          <Bouton variante="indice" onClick={onFermer}>
            OK, j’essaie
          </Bouton>
        </div>
      </div>
    </div>
  );
}
