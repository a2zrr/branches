// Formes des branches autour de chaque vignette : tracés exacts de design/maquettes/Vignettes.dc.html.
// couleur = n° de --branch-<n> (et --branch-<n>-edge pour le bord). Classe = animation bob (deco, d2, d3).

export interface FormeVignette {
  type: 'rond' | 'chemin';
  cx?: number;
  cy?: number;
  r?: number;
  d?: string;
  couleur: number;
  classe: 'deco' | 'd2' | 'd3';
}

export const FORMES_PAR_TEINTE: Record<'bleu' | 'violet' | 'orange', FormeVignette[]> = {
  bleu: [
    { type: 'rond', cx: 40.0, cy: 70.0, r: 12.0, couleur: 1, classe: 'deco' },
    { type: 'chemin', d: 'M234.0 28.0h24.0v24.0h-24.0z', couleur: 2, classe: 'd2' },
    { type: 'chemin', d: 'M270.0 194.4l15.600000000000001 15.600000000000001l-15.600000000000001 15.600000000000001l-15.600000000000001 -15.600000000000001z', couleur: 3, classe: 'd3' },
    { type: 'chemin', d: 'M30.0 208.8l14.399999999999999 24.0H15.6z', couleur: 4, classe: 'deco' },
    { type: 'chemin', d: 'M218.3 -5.100000000000001h7.4v7.4h7.4v7.4h-7.4v7.4h-7.4v-7.4h-7.4v-7.4h7.4z', couleur: 5, classe: 'd2' },
  ],
  violet: [
    { type: 'chemin', d: 'M36.0 44.4l15.600000000000001 15.600000000000001l-15.600000000000001 15.600000000000001l-15.600000000000001 -15.600000000000001z', couleur: 3, classe: 'deco' },
    { type: 'rond', cx: 262.0, cy: 52.0, r: 12.0, couleur: 1, classe: 'd2' },
    { type: 'chemin', d: 'M262.0 214.8l14.399999999999999 24.0H247.6z', couleur: 4, classe: 'd3' },
    { type: 'chemin', d: 'M10.0 202.0h24.0v24.0h-24.0z', couleur: 2, classe: 'deco' },
    { type: 'chemin', d: 'M214.0 -11.0 L217.9 -1.3 L228.3 -0.6 L220.3 6.0 L222.8 16.1 L214.0 10.6 L205.2 16.1 L207.7 6.0 L199.7 -0.6 L210.1 -1.3z', couleur: 6, classe: 'd2' },
  ],
  orange: [
    { type: 'chemin', d: 'M34.0 48.8l14.399999999999999 24.0H19.6z', couleur: 4, classe: 'deco' },
    { type: 'chemin', d: 'M248.3 36.9h7.4v7.4h7.4v7.4h-7.4v7.4h-7.4v-7.4h-7.4v-7.4h7.4z', couleur: 5, classe: 'd2' },
    { type: 'rond', cx: 272.0, cy: 216.0, r: 12.0, couleur: 1, classe: 'd3' },
    { type: 'chemin', d: 'M26.0 198.4l15.600000000000001 15.600000000000001l-15.600000000000001 15.600000000000001l-15.600000000000001 -15.600000000000001z', couleur: 3, classe: 'deco' },
    { type: 'chemin', d: 'M204.0 -10.0h24.0v24.0h-24.0z', couleur: 2, classe: 'd2' },
  ],
};
