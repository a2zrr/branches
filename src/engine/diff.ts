import { diff3Merge } from 'node-diff3';
import type { Arbre, Contenu, Segment } from './types';

/** Lignes ajoutées et supprimées entre deux contenus (LCS). */
export function statsLignes(anciennes: Contenu, nouvelles: Contenu): { ins: number; del: number } {
  const n = anciennes.length;
  const m = nouvelles.length;
  let precedent = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    const courant = new Array<number>(m + 1).fill(0);
    for (let j = 1; j <= m; j += 1) {
      courant[j] =
        anciennes[i - 1] === nouvelles[j - 1]
          ? (precedent[j - 1] ?? 0) + 1
          : Math.max(precedent[j] ?? 0, courant[j - 1] ?? 0);
    }
    precedent = courant;
  }
  const commun = precedent[m] ?? 0;
  return { ins: m - commun, del: n - commun };
}

export interface FichierModifie {
  chemin: string;
  ins: number;
  del: number;
  statut: 'ajoute' | 'supprime' | 'modifie';
}

/** Fichiers qui diffèrent entre deux arbres, triés par chemin. */
export function fichiersModifies(avant: Arbre, apres: Arbre): FichierModifie[] {
  const chemins = [...new Set([...Object.keys(avant), ...Object.keys(apres)])].sort();
  const resultat: FichierModifie[] = [];
  for (const chemin of chemins) {
    const a = avant[chemin];
    const b = apres[chemin];
    if (a === undefined && b === undefined) continue;
    if (a !== undefined && b !== undefined && a.length === b.length && a.every((l, i) => l === b[i]))
      continue;
    const { ins, del } = statsLignes(a ?? [], b ?? []);
    const statut = a === undefined ? 'ajoute' : b === undefined ? 'supprime' : 'modifie';
    resultat.push({ chemin, ins, del, statut });
  }
  return resultat;
}

/** Résumé « 2 files changed, 3 insertions(+), 1 deletion(-) » (ligne Git). */
export function resume(fichiers: readonly FichierModifie[]): string {
  const ins = fichiers.reduce((s, f) => s + f.ins, 0);
  const del = fichiers.reduce((s, f) => s + f.del, 0);
  const parties = [`${fichiers.length} file${fichiers.length > 1 ? 's' : ''} changed`];
  if (ins > 0) parties.push(`${ins} insertion${ins > 1 ? 's' : ''}(+)`);
  if (del > 0) parties.push(`${del} deletion${del > 1 ? 's' : ''}(-)`);
  return ` ${parties.join(', ')}`;
}

/** Lignes « create mode / delete mode » que Git affiche après le résumé. */
export function modesFichiers(fichiers: readonly FichierModifie[]): string[] {
  return fichiers.flatMap((f) => {
    if (f.statut === 'ajoute') return [` create mode 100644 ${f.chemin}`];
    if (f.statut === 'supprime') return [` delete mode 100644 ${f.chemin}`];
    return [];
  });
}

/** Ligne de statistiques par fichier : « src/a.js | 2 +- ». */
export function statsFichier(f: FichierModifie): string {
  return ` ${f.chemin} | ${f.ins + f.del} ${'+'.repeat(f.ins)}${'-'.repeat(f.del)}`;
}

/** Fusion à trois voies d'un fichier. Retourne des segments propres ou avec conflits. */
export function fusionTexte(
  ours: Contenu | undefined,
  base: Contenu | undefined,
  theirs: Contenu | undefined,
): { segments: Segment[]; conflit: boolean } {
  const regions = diff3Merge([...(ours ?? [])], [...(base ?? [])], [...(theirs ?? [])]);
  let conflit = false;
  const segments: Segment[] = regions.map((r): Segment => {
    if ('ok' in r) return { ok: r.ok ?? [] };
    conflit = true;
    return { conflit: { ours: r.conflict.a, theirs: r.conflict.b } };
  });
  return { segments, conflit };
}

/** Contenu final d'un fichier à partir des segments, avec les marqueurs de conflit Git. */
export function contenuAvecMarqueurs(segments: readonly Segment[], nomAutre: string): string[] {
  return segments.flatMap((s): string[] => {
    if ('ok' in s) return [...s.ok];
    return ['<<<<<<< HEAD', ...s.conflit.ours, '=======', ...s.conflit.theirs, `>>>>>>> ${nomAutre}`];
  });
}
