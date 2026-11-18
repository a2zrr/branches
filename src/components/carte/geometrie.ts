// Géométrie de la carte des missions (spec § 9 bis) : positions en zigzag et courbe du chemin.
// Fonctions pures.

export interface Mesures {
  /** Hauteur d'un rang (une mission), en px. */
  rang: number;
  /** Côté du bloc carré qui contient une pastille : son centre est à `aire / 2`. */
  aire: number;
  haut: number;
  bas: number;
  /** Décalages en zigzag, en px, par rapport au centre de la colonne. */
  zigzag: readonly number[];
  /** Diamètre des pastilles (et de la pastille en cours). */
  pastille: number;
  pastilleEnCours: number;
  /** Largeur du trait du chemin. */
  traitChemin: number;
  /** Côté de la vignette, en px. */
  vignette: number;
  /** Position horizontale de la vignette dans la zone (CSS). */
  vignetteGauche: string;
  /** Place ajoutée sous un chapitre qui précède le mur. */
  sousLeMur: number;
  /** Le mur remonte de cette hauteur sur le chapitre précédent. */
  murRemonte: number;
  /** Hauteur du mur de nuages. */
  murHauteur: number;
  /** Distance entre le haut du mur et la carte centrale. */
  carteMurTop: number;
  /** Version PC : côtés du mur qui s'effacent. */
  pc: boolean;
}

export const MESURES_PC: Mesures = {
  rang: 160,
  aire: 84,
  haut: 24,
  bas: 24,
  zigzag: [0, 70, 105, 70, 0, -70, -105, -70],
  pastille: 72,
  pastilleEnCours: 84,
  traitChemin: 12,
  vignette: 300,
  vignetteGauche: 'calc(50% - 390px)',
  sousLeMur: 100,
  murRemonte: 110,
  murHauteur: 450,
  carteMurTop: 178,
  pc: true,
};

/** Décalage d'une mission dans le zigzag (il se répète tous les 8). */
export function decalage(mesures: Mesures, index: number): number {
  return mesures.zigzag[index % mesures.zigzag.length] ?? 0;
}

/** Haut du bloc d'une mission, relatif à la zone du chapitre. */
export function hautDuRang(mesures: Mesures, index: number): number {
  return mesures.haut + index * mesures.rang;
}

/** Index de la mission sur laquelle la vignette est centrée : la 3e, ou la dernière s'il y en a moins. */
export function indexVignette(nombre: number): number {
  return Math.min(2, Math.max(nombre - 1, 0));
}

/** Centre d'une mission : (décalage, y). */
export function centre(mesures: Mesures, index: number): [number, number] {
  return [decalage(mesures, index), hautDuRang(mesures, index) + mesures.aire / 2];
}

/** Courbe en S entre des points successifs (spec § 9 bis, « Le chemin »). */
export function courbe(points: [number, number][]): string {
  return points.reduce((d, p, i) => {
    if (i === 0) return `M${p[0]} ${p[1]}`;
    const a = points[i - 1];
    if (a === undefined) return d;
    const h = (p[1] - a[1]) / 2;
    return `${d} C${a[0]} ${a[1] + h} ${p[0]} ${p[1] - h} ${p[0]} ${p[1]}`;
  }, '');
}

/** Téléphone (< 1 024 px) : pastilles plus petites, sans titres, vignette de 170 px (spec § 9 bis). */
export const MESURES_TEL: Mesures = {
  rang: 150,
  aire: 72,
  haut: 24,
  bas: 24,
  zigzag: [0, 40, 62, 40, 0, -40, -62, -40],
  pastille: 62,
  pastilleEnCours: 72,
  traitChemin: 10,
  vignette: 170,
  vignetteGauche: '4px',
  sousLeMur: 80,
  murRemonte: 96,
  murHauteur: 450,
  carteMurTop: 150,
  pc: false,
};
