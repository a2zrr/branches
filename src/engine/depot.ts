import { hashDeterministe } from './hash';
import type { Arbre, Commit, Contenu, Depot, FicheDepot, Head, Modifs } from './types';

/** Construit le dépôt initial depuis la fiche de mission. Les arbres sont calculés une fois pour toutes. */
export function creerDepot(fiche: FicheDepot): Depot {
  const commits: Record<string, Commit> = {};
  fiche.commits.forEach((fc, seq) => {
    const parent = fc.parents[0];
    const base: Record<string, Contenu> = parent !== undefined ? { ...(commits[parent]?.arbre ?? {}) } : {};
    for (const supprime of fc.supprimes ?? []) delete base[supprime];
    for (const [chemin, contenu] of Object.entries(fc.fichiers ?? {})) base[chemin] = contenu;
    commits[fc.id] = {
      id: fc.id,
      message: fc.message,
      parents: fc.parents,
      branche: fc.branche,
      auteur: fc.auteur ?? 'Toi',
      arbre: base,
      seq,
      ...(fc.type !== undefined ? { type: fc.type } : {}),
      ...(fc.annule !== undefined ? { annule: fc.annule } : {}),
    };
  });

  const branches: Record<string, string> = {};
  for (const b of fiche.branches) branches[b.nom] = b.pointe;

  const pointesInitiales = { ...branches };
  const ancetresInitiaux: Record<string, readonly string[]> = {};
  for (const [nom, pointe] of Object.entries(branches)) {
    ancetresInitiaux[nom] = [...ancestres(commits, pointe)];
  }

  const tags: Record<string, string> = {};
  for (const t of fiche.tags ?? []) tags[t.nom] = t.commit;

  const head: Head =
    'branche' in fiche.head
      ? { type: 'branche', nom: fiche.head.branche }
      : { type: 'commit', id: fiche.head.commit };

  const travail: Record<string, Contenu> = {};
  for (const [chemin, contenu] of Object.entries(fiche.travail ?? {})) travail[chemin] = contenu;

  return {
    commits,
    branches,
    ordreBranches: fiche.branches.map((b) => b.nom),
    pointesInitiales,
    ancetresInitiaux,
    tags,
    head,
    travail,
    index: {},
    prochainsHash: [...(fiche.prochainsHash ?? [])],
    bisect: null,
    fusion: null,
    testeur: fiche.testeur ?? null,
  };
}

/** Id du commit pointé par HEAD. */
export function idHead(depot: Depot): string {
  const head = depot.head;
  if (head.type === 'commit') return head.id;
  const pointe = depot.branches[head.nom];
  if (pointe === undefined) throw new Error(`Branche HEAD inconnue : ${head.nom}`);
  return pointe;
}

/** Ensemble des ancêtres d'un commit, lui compris. */
export function ancestres(commits: Readonly<Record<string, Commit>>, id: string): Set<string> {
  const vus = new Set<string>();
  const pile = [id];
  while (pile.length > 0) {
    const courant = pile.pop();
    if (courant === undefined || vus.has(courant)) continue;
    const c = commits[courant];
    if (c === undefined) continue;
    vus.add(courant);
    pile.push(...c.parents);
  }
  return vus;
}

/** Ancêtre commun le plus récent de deux commits (base de fusion). */
export function baseFusion(depot: Depot, a: string, b: string): string | null {
  const ea = ancestres(depot.commits, a);
  const eb = ancestres(depot.commits, b);
  let meilleur: Commit | null = null;
  for (const id of ea) {
    if (!eb.has(id)) continue;
    const c = depot.commits[id];
    if (c !== undefined && (meilleur === null || c.seq > meilleur.seq)) meilleur = c;
  }
  return meilleur?.id ?? null;
}

/** Résout une référence : HEAD, branche, tag, hash complet ou préfixe ≥ 4, avec suffixes ~n et ^n. */
export function resoudre(depot: Depot, ref: string): string | null {
  const m = /^(.*?)((?:~\d*|\^\d*)*)$/.exec(ref);
  const base = m?.[1] ?? ref;
  const suffixe = m?.[2] ?? '';
  let courant: string | null = resoudreBase(depot, base);
  for (const [, op, nombre] of suffixe.matchAll(/([~^])(\d*)/g)) {
    const n = nombre === undefined || nombre === '' ? 1 : parseInt(nombre, 10);
    const pas = op === '~' ? n : 1;
    for (let i = 0; i < pas && courant !== null; i += 1) {
      courant = depot.commits[courant]?.parents[0] ?? null;
    }
  }
  return courant;
}

function resoudreBase(depot: Depot, ref: string): string | null {
  if (ref === 'HEAD') return idHead(depot);
  if (Object.prototype.hasOwnProperty.call(depot.branches, ref)) return depot.branches[ref] ?? null;
  if (Object.prototype.hasOwnProperty.call(depot.tags, ref)) return depot.tags[ref] ?? null;
  if (ref in depot.commits) return ref;
  if (ref.length >= 4 && /^[0-9a-f]+$/.test(ref)) {
    const correspondants = Object.keys(depot.commits).filter((id) => id.startsWith(ref));
    if (correspondants.length === 1) return correspondants[0] ?? null;
  }
  return null;
}

/** Contenu d'un fichier tel que vu dans l'espace de travail. */
export function contenuTravail(depot: Depot, chemin: string): Contenu | null {
  if (chemin in depot.travail) return depot.travail[chemin] ?? null;
  if (chemin in depot.index) return depot.index[chemin] ?? null;
  return depot.commits[idHead(depot)]?.arbre[chemin] ?? null;
}

/** Arbre du commit HEAD. */
export function arbreHead(depot: Depot): Arbre {
  return depot.commits[idHead(depot)]?.arbre ?? {};
}

/** Retire les entrées d'index et de travail qui n'ont plus de sens par rapport au HEAD. */
export function normaliser(depot: Depot): Depot {
  const arbre = arbreHead(depot);
  const index: Record<string, Contenu | null> = {};
  for (const [chemin, contenu] of Object.entries(depot.index)) {
    if (!memesContenus(arbre[chemin] ?? null, contenu ?? null)) index[chemin] = contenu ?? null;
  }
  const travail: Record<string, Contenu | null> = {};
  for (const [chemin, contenu] of Object.entries(depot.travail)) {
    const reference = chemin in index ? (index[chemin] ?? null) : (arbre[chemin] ?? null);
    if (!memesContenus(reference, contenu ?? null)) travail[chemin] = contenu ?? null;
  }
  return { ...depot, index, travail };
}

export function memesContenus(a: Contenu | null, b: Contenu | null): boolean {
  if (a === null || b === null) return a === b;
  return a.length === b.length && a.every((ligne, i) => ligne === b[i]);
}

/** Id libre pour un nouveau commit : prochainsHash d'abord, sinon hash déterministe. */
export function nouvelId(
  depot: Depot,
  message: string,
  parents: readonly string[],
): { id: string; depot: Depot } {
  const [suivant, ...reste] = depot.prochainsHash;
  if (suivant !== undefined && !(suivant in depot.commits)) {
    return { id: suivant, depot: { ...depot, prochainsHash: reste } };
  }
  const graine = `${Object.keys(depot.commits).length}|${message}|${parents.join(',')}`;
  return { id: hashDeterministe(graine, depot.commits), depot };
}

/** Modifications (index) sans ancienne entrée : helper pour construire un Modifs. */
export function modifsVides(): Modifs {
  return {};
}
