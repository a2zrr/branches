// Placement pur du graphe des commits (port de design/maquettes/GrapheCommits.dc.html, spec §6).
// Aucune dépendance à React ni au DOM : c'est une fonction de données vers coordonnées.

export const ROW = 50;
export const GAP = 34;
export const PAD = 26;

export type Forme = 'cercle' | 'carre' | 'losange' | 'triangle' | 'croix' | 'etoile';
const FORMES: readonly Forme[] = ['cercle', 'carre', 'losange', 'triangle', 'croix', 'etoile'];

export interface BrancheG {
  nom: string;
  pointe: string;
}

export interface CommitG {
  id: string;
  message: string;
  branche: string;
  parents: readonly string[];
  type?: 'revert';
  annule?: string;
}

export interface VueG {
  nouveau?: string;
  selection?: string;
  bisect?: { bons?: readonly string[]; mauvais?: readonly string[]; test?: string };
}

export interface DonneesGraphe {
  /** Ordre des colonnes. */
  branches: readonly BrancheG[];
  /** Du plus ancien au plus récent. */
  commits: readonly CommitG[];
  head: { branche: string } | { commit: string };
  tags?: readonly { nom: string; commit: string }[];
  vue?: VueG;
}

export interface StyleBranche {
  /** Numéro de la couleur de branche : 1 à 6 (--branch-1 à --branch-6). */
  couleur: number;
  forme: Forme;
  /** Motif : 0 plein, 1 tirets évidés, 2 pointillés évidés. */
  motif: 0 | 1 | 2;
  tirets: string;
  evide: boolean;
}

/** Couleur, forme et motif d'une branche d'index i. */
export function styleBranche(i: number): StyleBranche {
  const motif = (Math.floor(i / 6) % 3) as 0 | 1 | 2;
  return {
    couleur: (i % 6) + 1,
    forme: FORMES[i % 6] ?? 'cercle',
    motif,
    tirets: motif === 0 ? 'none' : motif === 1 ? '7 6' : '2 7',
    evide: motif > 0,
  };
}

/** Colonne de chaque commit : celle de sa branche, sinon celle de son premier parent, sinon 0. */
export function colonnes(donnees: DonneesGraphe): Record<string, number> {
  const voie: Record<string, number> = {};
  donnees.branches.forEach((b, i) => {
    voie[b.nom] = i;
  });
  const colonne: Record<string, number> = {};
  for (const c of donnees.commits) {
    const debut = voie[c.branche];
    const premier = c.parents[0];
    if (debut !== undefined) colonne[c.id] = debut;
    else if (premier !== undefined && colonne[premier] !== undefined) colonne[c.id] = colonne[premier] ?? 0;
    else colonne[c.id] = 0;
  }
  return colonne;
}

export function x(colonne: number): number {
  return PAD + colonne * GAP;
}

/** Rang 0 = commit le plus récent (en haut). */
export function rangs(donnees: DonneesGraphe): Record<string, number> {
  const n = donnees.commits.length;
  const r: Record<string, number> = {};
  donnees.commits.forEach((c, i) => {
    r[c.id] = n - 1 - i;
  });
  return r;
}

export function y(rang: number): number {
  return rang * ROW + ROW / 2;
}

export type TypeLien = 'droit' | 'depart' | 'fusion';

/** Chemin SVG d'un lien entre un commit (x1, y1) et son parent (x2, y2). */
export function cheminLien(type: TypeLien, x1: number, y1: number, x2: number, y2: number): string {
  const n = (v: number): string => String(Math.round(v * 100) / 100);
  if (type === 'droit') return `M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}`;
  if (type === 'depart') {
    return `M${n(x1)} ${n(y1)} L${n(x1)} ${n(y2 - ROW)} C${n(x1)} ${n(y2 - ROW * 0.4)} ${n(x2)} ${n(y2 - ROW * 0.6)} ${n(x2)} ${n(y2)}`;
  }
  return `M${n(x1)} ${n(y1)} C${n(x1)} ${n(y1 + ROW * 0.6)} ${n(x2)} ${n(y1 + ROW * 0.4)} ${n(x2)} ${n(y1 + ROW)} L${n(x2)} ${n(y2)}`;
}

/** Chemin SVG d'une forme centrée sur (0, 0), de rayon R (spec §6 et maquette). */
export function cheminForme(forme: Forme, R: number): string {
  const k = (v: number): number => Math.round(v * 100) / 100;
  if (forme === 'carre') {
    const s = k(R * 0.86);
    return `M${-s} ${-s}h${2 * s}v${2 * s}h${-2 * s}z`;
  }
  if (forme === 'losange') {
    const r = k(R * 1.14);
    return `M0 ${-r}L${r} 0L0 ${r}L${-r} 0z`;
  }
  if (forme === 'triangle') {
    const r = k(R * 1.15);
    return `M0 ${-r}L${r} ${k(r * 0.82)}H${-r}z`;
  }
  if (forme === 'croix') {
    const a = k(R * 0.36);
    const b = k(R * 1.1);
    const m = k(b - a);
    return `M${-a} ${-b}h${k(2 * a)}v${m}h${m}v${k(2 * a)}h${-m}v${m}h${k(-2 * a)}v${-m}h${-m}v${k(-2 * a)}h${m}z`;
  }
  if (forme === 'etoile') {
    let p = '';
    for (let i = 0; i < 10; i += 1) {
      const ang = ((-90 + 36 * i) * Math.PI) / 180;
      const rr = i % 2 === 0 ? R * 1.2 : R * 0.52;
      p += `${i === 0 ? 'M' : 'L'}${k(Math.cos(ang) * rr)} ${k(Math.sin(ang) * rr)}`;
    }
    return `${p}z`;
  }
  return `M${-R} 0a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0z`;
}

export interface NoeudG {
  id: string;
  x: number;
  y: number;
  forme: Forme;
  couleur: number;
  evide: boolean;
  tirets: string;
  type: 'normal' | 'fusion' | 'revert';
  R: number;
  annule: boolean;
  etat: 'normal' | 'selection' | 'head' | 'nouveau';
  bisect?: 'bon' | 'mauvais' | 'test';
}

export interface LienG {
  de: string;
  vers: string;
  type: TypeLien;
  chemin: string;
  couleur: number;
  tirets: string;
}

export type EtiquetteG =
  | { type: 'head'; nom: string; detache: boolean }
  | { type: 'branche'; nom: string; index: number }
  | { type: 'tag'; nom: string }
  | { type: 'puce'; ton: 'info' | 'ok' | 'ko' | 'indice'; libelle: string };

export interface LigneG {
  id: string;
  message: string;
  annule: boolean;
  etat: 'normal' | 'selection' | 'nouveau';
  etiquettes: EtiquetteG[];
}

export interface GrapheG {
  largeur: number;
  hauteur: number;
  noeuds: NoeudG[];
  liens: LienG[];
  /** Lignes, du plus récent au plus ancien. */
  lignes: LigneG[];
}

/** Calcule tout le graphe : colonnes, rangées, liens, nœuds, étiquettes. */
export function placerGraphe(donnees: DonneesGraphe): GrapheG {
  const col = colonnes(donnees);
  const rang = rangs(donnees);
  const parId = new Map(donnees.commits.map((c) => [c.id, c] as const));
  const nbColonnes = Math.max(1, donnees.branches.length);
  const largeur = PAD * 2 + (nbColonnes - 1) * GAP;
  const hauteur = donnees.commits.length * ROW;
  const vue = donnees.vue ?? {};

  const annulePar: Record<string, string> = {};
  for (const c of donnees.commits) if (c.annule !== undefined) annulePar[c.annule] = c.id;

  const headDetache = 'commit' in donnees.head;
  const headBranche = 'branche' in donnees.head ? donnees.head.branche : null;
  const headId: string | null =
    'commit' in donnees.head
      ? donnees.head.commit
      : (donnees.branches.find((b) => b.nom === headBranche)?.pointe ?? null);

  const liens: LienG[] = [];
  for (const c of donnees.commits) {
    c.parents.forEach((pid, k) => {
      if (!parId.has(pid)) return;
      const x1 = x(col[c.id] ?? 0);
      const y1 = y(rang[c.id] ?? 0);
      const x2 = x(col[pid] ?? 0);
      const y2 = y(rang[pid] ?? 0);
      let type: TypeLien;
      let couleur: number;
      if (x1 === x2) {
        type = 'droit';
        couleur = col[c.id] ?? 0;
      } else if (k > 0) {
        type = 'fusion';
        couleur = col[pid] ?? 0;
      } else {
        type = 'depart';
        couleur = col[c.id] ?? 0;
      }
      liens.push({
        de: c.id,
        vers: pid,
        type,
        chemin: cheminLien(type, x1, y1, x2, y2),
        couleur: styleBranche(couleur).couleur,
        tirets: styleBranche(couleur).tirets,
      });
    });
  }

  const noeuds: NoeudG[] = donnees.commits.map((c) => {
    const colonne = col[c.id] ?? 0;
    const style = styleBranche(colonne);
    const fusion = c.parents.length > 1;
    const revert = c.type === 'revert' || c.annule !== undefined;
    const bisect = vue.bisect;
    let marque: NoeudG['bisect'];
    if (bisect?.bons?.includes(c.id)) marque = 'bon';
    else if (bisect?.mauvais?.includes(c.id)) marque = 'mauvais';
    else if (bisect?.test === c.id) marque = 'test';
    let etat: NoeudG['etat'] = 'normal';
    if (vue.nouveau === c.id) etat = 'nouveau';
    else if (c.id === headId) etat = 'head';
    else if (vue.selection === c.id) etat = 'selection';
    return {
      id: c.id,
      x: x(colonne),
      y: y(rang[c.id] ?? 0),
      forme: style.forme,
      couleur: style.couleur,
      evide: style.evide || annulePar[c.id] !== undefined,
      tirets: annulePar[c.id] !== undefined ? '4 4' : 'none',
      type: fusion ? 'fusion' : revert ? 'revert' : 'normal',
      R: fusion || revert ? 13.5 : 11,
      annule: annulePar[c.id] !== undefined,
      etat,
      ...(marque !== undefined ? { bisect: marque } : {}),
    };
  });

  const lignes: LigneG[] = [...donnees.commits].reverse().map((c) => {
    const etiquettes: EtiquetteG[] = [];
    if (c.id === headId)
      etiquettes.push({ type: 'head', nom: headDetache ? 'HEAD' : 'HEAD →', detache: headDetache });
    donnees.branches.forEach((b, i) => {
      if (b.pointe === c.id) etiquettes.push({ type: 'branche', nom: b.nom, index: i });
    });
    for (const t of donnees.tags ?? []) {
      if (t.commit === c.id) etiquettes.push({ type: 'tag', nom: t.nom });
    }
    if (vue.nouveau === c.id) etiquettes.push({ type: 'puce', ton: 'ok', libelle: 'nouveau' });
    const annulant = annulePar[c.id];
    if (annulant !== undefined)
      etiquettes.push({ type: 'puce', ton: 'ko', libelle: `annulé par ${annulant}` });
    if (vue.bisect?.bons?.includes(c.id)) etiquettes.push({ type: 'puce', ton: 'ok', libelle: 'bon' });
    if (vue.bisect?.mauvais?.includes(c.id)) etiquettes.push({ type: 'puce', ton: 'ko', libelle: 'mauvais' });
    if (vue.bisect?.test === c.id) etiquettes.push({ type: 'puce', ton: 'indice', libelle: 'à tester' });
    return {
      id: c.id,
      message: c.message,
      annule: annulant !== undefined,
      etat: vue.nouveau === c.id ? 'nouveau' : vue.selection === c.id ? 'selection' : 'normal',
      etiquettes,
    };
  });

  return { largeur, hauteur, noeuds, liens, lignes };
}
