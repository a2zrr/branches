export type TypeLigneConflit = 'normale' | 'debut' | 'ours' | 'separation' | 'theirs' | 'fin';

export interface LigneConflit {
  texte: string;
  type: TypeLigneConflit;
  /** Numéro du bloc (0-based) pour les lignes de conflit, sinon null. */
  bloc: number | null;
}

/** Découpe les marqueurs `<<<<<<< HEAD`, `=======`, `>>>>>>> branche` en lignes typées. */
export function analyserMarqueurs(lignes: readonly string[]): LigneConflit[] {
  let bloc = -1;
  let dedans: 'hors' | 'ours' | 'theirs' = 'hors';
  return lignes.map((texte): LigneConflit => {
    if (texte.startsWith('<<<<<<< ')) {
      bloc += 1;
      dedans = 'ours';
      return { texte, type: 'debut', bloc };
    }
    if (texte === '=======' && dedans !== 'hors') {
      dedans = 'theirs';
      return { texte, type: 'separation', bloc };
    }
    if (texte.startsWith('>>>>>>> ') && dedans !== 'hors') {
      const b = bloc;
      dedans = 'hors';
      return { texte, type: 'fin', bloc: b };
    }
    if (dedans === 'ours') return { texte, type: 'ours', bloc };
    if (dedans === 'theirs') return { texte, type: 'theirs', bloc };
    return { texte, type: 'normale', bloc: null };
  });
}
