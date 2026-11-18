import { useEffect } from 'react';
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

  // Échap et clic en dehors ferment le panneau. Le bouton INDICE, lui, bascule seul.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    const souris = (e: MouseEvent) => {
      const cible = e.target as Element | null;
      if (cible?.closest('#panneau-indice') || cible?.closest('[data-indice-bouton]')) return;
      onFermer();
    };
    window.addEventListener('keydown', touche);
    window.addEventListener('mousedown', souris);
    return () => {
      window.removeEventListener('keydown', touche);
      window.removeEventListener('mousedown', souris);
    };
  }, [onFermer]);

  return (
    <div id="panneau-indice" className={styles.panneau} role="dialog" aria-label="Indice">
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
          <Bouton variante="secondaire" onClick={onFermer}>
            Fermer
          </Bouton>
        </div>
      </div>
    </div>
  );
}
