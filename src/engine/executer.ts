import { ancestres, idHead } from './depot';
import { decouper } from './parseur';
import { erreur, distance } from './erreurs';
import { ajouter, commit } from './commandes/ajout';
import { statut } from './commandes/statut';
import { log, montrer, aide } from './commandes/historique';
import { branche, changer, extraire, tag } from './commandes/branches';
import { fusionner } from './commandes/fusion';
import { annuler } from './commandes/revert';
import { remettre } from './commandes/reset';
import { bisect } from './commandes/bisect';
import type { Depot, ResultatCommande, ResultatExecution } from './types';

type Commande = (depot: Depot, args: string[]) => ResultatCommande;

const COMMANDES: Record<string, Commande> = {
  add: ajouter,
  bisect,
  branch: branche,
  checkout: extraire,
  commit,
  log,
  merge: fusionner,
  reset: remettre,
  revert: annuler,
  show: montrer,
  status: statut,
  switch: changer,
  tag,
};

/**
 * Exécute une ligne de commande sur un dépôt. Ne modifie jamais le dépôt reçu : renvoie un nouveau dépôt.
 * Les événements servent aux animations du graphe.
 */
export function executer(depot: Depot, ligne: string): ResultatExecution {
  const jetons = decouper(ligne.trim());
  const vide = { depot, sortie: [], evenements: [], compte: false };
  const premier = jetons[0];
  if (premier === undefined) return vide;
  if (premier === 'clear') return vide;

  if (depot.testeur !== null && ligne.trim() === depot.testeur.commande) {
    const contient = ancestres(depot.commits, idHead(depot)).has(depot.testeur.fautif);
    return {
      depot,
      sortie: [contient ? depot.testeur.sortieKo : depot.testeur.sortieOk],
      evenements: [],
      compte: true,
    };
  }

  if (premier !== 'git') {
    return {
      depot,
      sortie: [],
      erreur: erreur('commande-hors-git', [`bash: ${premier}: command not found`], premier),
      evenements: [],
      compte: true,
    };
  }

  const sousCommande = jetons[1];
  const args = jetons.slice(2);
  if (sousCommande === undefined) {
    return {
      depot,
      sortie: [],
      erreur: erreur('usage', ['usage: git [-v | --version] [-h | --help] <command> [<args>]'], ''),
      evenements: [],
      compte: true,
    };
  }
  if (sousCommande === 'help') return { ...aide(depot), compte: false };

  const commande = Object.prototype.hasOwnProperty.call(COMMANDES, sousCommande)
    ? COMMANDES[sousCommande]
    : undefined;
  if (commande !== undefined) {
    return { ...commande(depot, args), compte: true };
  }

  const proche = Object.keys(COMMANDES)
    .map((nom) => ({ nom, d: distance(sousCommande, nom) }))
    .filter((c) => c.d <= 2)
    .sort((a, b) => a.d - b.d)[0];
  const texte = [`git: '${sousCommande}' is not a git command. See 'git --help'.`];
  if (proche !== undefined) texte.push('', 'The most similar command is', `\t${proche.nom}`);
  return {
    depot,
    sortie: [],
    erreur: erreur('commande-inconnue', texte, sousCommande),
    evenements: [],
    compte: true,
  };
}
