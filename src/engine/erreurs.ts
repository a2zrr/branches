import type { CodeErreur, ErreurGit } from './types';

/** Explication pédagogique (en français) de chaque erreur, affichée dans le bandeau rouge. */
const EXPLICATIONS: Record<CodeErreur, (ctx: string) => string> = {
  'commande-inconnue': (ctx) =>
    `Presque ! Git ne connaît pas « ${ctx} ». Lis la suggestion juste au-dessus : il a deviné ce que tu voulais dire.`,
  'commande-hors-git': (ctx) =>
    `« ${ctx} » n'est pas une commande Git. Tape les commandes Git avec le mot git devant.`,
  'revision-invalide': (ctx) =>
    `Git ne trouve pas le commit « ${ctx} ». Vérifie le hash avec git log --oneline.`,
  'reference-invalide': (ctx) =>
    `Git ne connaît pas la référence « ${ctx} ». Une branche, un tag ou un hash suffit.`,
  pathspec: (ctx) => `Git ne trouve aucun fichier ou branche appelé « ${ctx} ».`,
  'merge-inconnu': (ctx) => `Git ne peut fusionner que des branches. « ${ctx} » n'en est pas une.`,
  'rien-a-valider': () =>
    `Rien n'est prêt à être enregistré. Prépare tes fichiers avec git add avant git commit.`,
  'branche-existe': (ctx) =>
    `La branche « ${ctx} » existe déjà. Choisis un autre nom, ou utilise-la directement.`,
  'branche-introuvable': (ctx) => `La branche « ${ctx} » n'existe pas.`,
  'branche-courante': (ctx) => `Tu ne peux pas supprimer la branche « ${ctx} » : tu es dessus.`,
  'branche-non-fusionnee': (ctx) =>
    `La branche « ${ctx} » contient du travail absent de ta branche. Fusionne-la avant de la supprimer.`,
  'conflits-non-resolus': () =>
    `Des conflits ne sont pas encore résolus. Choisis ce que tu gardes dans chaque fichier, puis enregistre.`,
  'modifs-ecrasees': () =>
    `Tu as des modifications non enregistrées qui seraient écrasées. Enregistre-les d'abord avec git commit.`,
  'pas-de-fusion': () => `Il n'y a aucune fusion en cours à annuler.`,
  'tag-existe': (ctx) => `Le tag « ${ctx} » existe déjà.`,
  arguments: (ctx) => `La commande n'a pas les bons arguments : ${ctx}.`,
  usage: () => `Tape git help pour voir les commandes disponibles.`,
};

export function erreur(code: CodeErreur, texte: string[], ctx = ''): ErreurGit {
  return { code, texte, explication: EXPLICATIONS[code](ctx) };
}

/** Distance de Levenshtein, pour suggérer la commande la plus proche. */
export function distance(a: string, b: string): number {
  let precedent = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const courant = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      courant[j] = Math.min(
        (precedent[j] ?? 0) + 1,
        (courant[j - 1] ?? 0) + 1,
        (precedent[j - 1] ?? 0) + cout,
      );
    }
    precedent = courant;
  }
  return precedent[b.length] ?? 0;
}
