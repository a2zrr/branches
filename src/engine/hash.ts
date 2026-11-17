/** Hash déterministe de 7 caractères hexadécimaux (FNV-1a 32 bits), unique parmi les ids existants. */
export function hashDeterministe(graine: string, existants: Readonly<Record<string, unknown>>): string {
  let essai = 0;
  for (;;) {
    const id = fnv1a(`${graine}#${essai}`).slice(0, 7);
    if (!(id in existants)) return id;
    essai += 1;
  }
}

function fnv1a(texte: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i += 1) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
