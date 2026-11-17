/** Découpe une ligne de commande : espaces, guillemets simples et doubles. */
export function decouper(ligne: string): string[] {
  const jetons: string[] = [];
  let courant = '';
  let enCours = false;
  let guillemet: '"' | "'" | null = null;

  for (const c of ligne) {
    if (guillemet) {
      if (c === guillemet) guillemet = null;
      else courant += c;
    } else if (c === '"' || c === "'") {
      guillemet = c;
      enCours = true;
    } else if (/\s/.test(c)) {
      if (enCours) {
        jetons.push(courant);
        courant = '';
        enCours = false;
      }
    } else {
      courant += c;
      enCours = true;
    }
  }
  if (enCours) jetons.push(courant);
  return jetons;
}
