import { ancestres, idHead, resoudre } from '../depot';
import { erreur } from '../erreurs';
import type { Depot, EtatBisect, Evenement, Head, ResultatCommande } from '../types';
import { ok } from './commun';

/**
 * Choix du commit à tester : parmi les candidats (ancêtres du mauvais commit qui ne sont pas
 * ancêtres d'un bon), le candidat du milieu, la liste étant triée du plus ancien au plus récent.
 */
function candidats(depot: Depot, b: EtatBisect): string[] {
  if (b.bons === null || b.goods.length === 0) return [];
  const exclus = new Set<string>();
  for (const g of b.goods) for (const id of ancestres(depot.commits, g)) exclus.add(id);
  return [...ancestres(depot.commits, b.bons)]
    .filter((id) => !exclus.has(id))
    .sort((x, y) => (depot.commits[x]?.seq ?? 0) - (depot.commits[y]?.seq ?? 0));
}

/** Avance la recherche après un verdict. */
function etape(depot: Depot, b: EtatBisect): ResultatCommande {
  const liste = candidats(depot, b);
  const n = liste.length;
  if (n === 0) {
    return {
      ...ok(depot),
      erreur: erreur('arguments', ['fatal: no candidate commits left to test'], 'bisect'),
    };
  }
  const premier = liste[0] ?? '';
  if (n === 1) {
    const c = depot.commits[premier];
    const suivant: Depot = {
      ...depot,
      head: { type: 'commit', id: premier },
      bisect: { ...b, courant: premier, resultat: premier },
    };
    return {
      depot: suivant,
      sortie: [`${premier} is the first bad commit`, `commit ${premier}`, `    ${c?.message ?? ''}`],
      evenements: [],
    };
  }
  const milieu = liste[Math.floor((n - 1) / 2)] ?? premier;
  const message = depot.commits[milieu]?.message ?? '';
  const suivant: Depot = {
    ...depot,
    head: { type: 'commit', id: milieu },
    bisect: { ...b, courant: milieu },
  };
  const restants = n - 1;
  const etapes = Math.ceil(Math.log2(n));
  return {
    depot: suivant,
    sortie: [
      `Bisecting: ${restants} revision${restants > 1 ? 's' : ''} left to test after this (roughly ${etapes} step${etapes > 1 ? 's' : ''})`,
      `[${milieu}] ${message}`,
    ],
    evenements: [{ type: 'bisectEtape', commit: milieu, verdict: 'test' } satisfies Evenement],
  };
}

/** git bisect start | bad [ref] | good [ref] | reset */
export function bisect(depot: Depot, args: string[]): ResultatCommande {
  const sous = args[0];
  if (sous === 'start') {
    if (depot.bisect !== null) return ok(depot);
    return ok({
      ...depot,
      bisect: { origine: depot.head, bons: null, goods: [], courant: null, resultat: null },
    });
  }
  if (sous === 'reset') {
    if (depot.bisect === null) {
      return { ...ok(depot), erreur: erreur('arguments', ['fatal: We are not bisecting.'], 'bisect') };
    }
    const origine: Head = depot.bisect.origine;
    const courant = idHead(depot);
    const message = depot.commits[courant]?.message ?? '';
    const sortie = [`Previous HEAD position was ${courant} ${message}`];
    const suivant: Depot = { ...depot, head: origine, bisect: null };
    if (origine.type === 'branche') sortie.push(`Switched to branch '${origine.nom}'`);
    return {
      depot: suivant,
      sortie,
      evenements: [{ type: 'headDeplace', de: courant, vers: idHead(suivant) }],
    };
  }
  if (sous === 'bad' || sous === 'good' || sous === 'new' || sous === 'old') {
    const ref = args[1] ?? 'HEAD';
    const id = resoudre(depot, ref);
    if (id === null || depot.commits[id] === undefined) {
      return { ...ok(depot), erreur: erreur('revision-invalide', [`fatal: bad revision '${ref}'`], ref) };
    }
    const base: Depot =
      depot.bisect === null
        ? { ...depot, bisect: { origine: depot.head, bons: null, goods: [], courant: null, resultat: null } }
        : depot;
    const b = base.bisect;
    if (b === null) return ok(depot);
    const bad = sous === 'bad' || sous === 'new';
    const maj: EtatBisect = bad ? { ...b, bons: id } : { ...b, goods: [...b.goods, id] };
    const avecVerdict: Depot = { ...base, bisect: maj };
    const verdict = bad ? 'mauvais' : 'bon';
    if (maj.bons === null || maj.goods.length === 0) {
      return { depot: avecVerdict, sortie: [], evenements: [{ type: 'bisectEtape', commit: id, verdict }] };
    }
    const res = etape(avecVerdict, maj);
    return { ...res, evenements: [{ type: 'bisectEtape', commit: id, verdict }, ...res.evenements] };
  }
  return { ...ok(depot), erreur: erreur('usage', ['usage: git bisect [start|bad|good|reset]'], sous ?? '') };
}
