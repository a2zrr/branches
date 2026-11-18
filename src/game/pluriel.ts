/** Accord français : 0 et 1 au singulier, le reste au pluriel. */
export function pluriel(n: number, singulier: string, pluriel: string): string {
  return n === 0 || n === 1 ? singulier : pluriel;
}

/** « 1 notion maîtrisée », « 15 notions maîtrisées », « 0 commande ». */
export function compter(n: number, singulier: string, pluriel_: string): string {
  return `${n} ${pluriel(n, singulier, pluriel_)}`;
}
