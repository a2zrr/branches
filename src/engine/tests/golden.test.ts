import { describe, expect, it } from 'vitest';
import m4 from '../../data/missions/c1-m4.json';
import m2 from '../../data/missions/c2-m2.json';
import m5 from '../../data/missions/c1-m5.json';
import m6 from '../../data/missions/c1-m6.json';
import m1 from '../../data/missions/c1-m1.json';
import m3 from '../../data/missions/c1-m3.json';
import { executer } from '../executer';
import { depotDe, jouer, sortieDe, gelerProfond } from './utilitaires';
import { creerDepot } from '../depot';
import type { FicheDepot } from '../types';

describe('sorties exactes (golden)', () => {
  it('c1-m4 : git log --oneline affiche exactement les 5 lignes attendues', () => {
    expect(sortieDe(depotDe(m4), 'git log --oneline')).toEqual([
      'e4d5f6a (HEAD -> main) style: bouton de démo plus gros',
      'a3f9c2e config: ajoute la clé API (temporaire promis)',
      '9b8c7d6 fix final v3 (le vrai)',
      "5d6e7f8 ajoute la page d'accueil",
      '1a2b3c4 init: premier commit',
    ]);
  });

  it('c1-m4 : git revert a3f9c2e affiche exactement la sortie attendue', () => {
    const r = executer(depotDe(m4), 'git revert a3f9c2e');
    expect(r.sortie).toEqual([
      '[main f0e1d2c] Revert "config: ajoute la clé API (temporaire promis)"',
      ' 1 file changed, 1 deletion(-)',
    ]);
  });

  it("c1-m4 : git rever a3f9c2e affiche exactement l'erreur attendue", () => {
    const depart = depotDe(m4);
    const r = executer(depart, 'git rever a3f9c2e');
    expect(r.erreur?.texte).toEqual([
      "git: 'rever' is not a git command. See 'git --help'.",
      '',
      'The most similar command is',
      '\trevert',
    ]);
    expect(r.erreur?.explication).toContain('Presque !');
    expect(r.depot).toBe(depart);
  });

  it('c2-m2 : git merge feature/paiement produit le conflit attendu et les marqueurs', () => {
    const r = executer(depotDe(m2), 'git merge feature/paiement');
    expect(r.sortie).toEqual([
      'Auto-merging src/BoutonPayer.jsx',
      'CONFLICT (content): Merge conflict in src/BoutonPayer.jsx',
      'Automatic merge failed; fix conflicts and then commit the result.',
    ]);
    const fichier = r.depot.travail['src/BoutonPayer.jsx'] ?? [];
    const debut = fichier.indexOf('<<<<<<< HEAD');
    const milieu = fichier.indexOf('=======');
    const fin = fichier.indexOf('>>>>>>> feature/paiement');
    expect(debut).toBeGreaterThanOrEqual(0);
    expect(milieu).toBeGreaterThan(debut);
    expect(fin).toBeGreaterThan(milieu);
    expect(fichier.slice(debut + 1, milieu).join('\n')).toContain('Payer {total} €');
    expect(fichier.slice(milieu + 1, fin).join('\n')).toContain('PAYER VITE');
  });

  it('c1-m5 : git merge feature/paiement fusionne sans conflit (fast-forward impossible)', () => {
    const r = executer(depotDe(m5), 'git merge feature/paiement');
    expect(r.erreur).toBeUndefined();
    expect(r.sortie[0]).toBe("Merge made by the 'ort' strategy.");
    expect(r.depot.commits[r.depot.branches['main'] ?? '']?.parents).toHaveLength(2);
    expect(r.depot.commits[r.depot.branches['main'] ?? '']?.message).toBe("Merge branch 'feature/paiement'");
  });

  it('c1-m1 : git commit enregistre la correction et annonce le commit', () => {
    const { resultats } = jouer(depotDe(m1), [
      'git add src/Accueil.jsx',
      'git commit -m "fix: corrige le nom sur l\'accueil"',
    ]);
    expect(resultats[1]?.sortie[0]).toBe("[main c0d1e2f] fix: corrige le nom sur l'accueil");
  });

  it('c1-m3 : git switch -c demo crée et bascule', () => {
    const { depot, resultats } = jouer(depotDe(m3), ['git switch -c demo']);
    expect(resultats[0]?.sortie).toEqual(["Switched to a new branch 'demo'"]);
    expect(depot.head).toEqual({ type: 'branche', nom: 'demo' });
  });
});

describe('solution de c1-m6 (bisect) : séquence qui trouve 7a8b9c0', () => {
  it('trouve le commit fautif en 9 commandes', () => {
    const solution = [
      'git bisect start',
      'git bisect bad',
      'git bisect good v0.9',
      'npm run test:prix',
      'git bisect bad',
      'npm run test:prix',
      'git bisect good',
      'npm run test:prix',
      'git bisect bad',
    ];
    const { depot } = jouer(depotDe(m6), solution);
    expect(depot.bisect?.resultat).toBe('7a8b9c0');
  });

  it('le testeur répond KO quand HEAD contient le commit fautif, OK sinon', () => {
    const surHead = executer(depotDe(m6), 'npm run test:prix');
    expect(surHead.sortie).toEqual(['✘ prix affiché : 0,00 €']);
    const { resultats } = jouer(depotDe(m6), ['git checkout 3c4d5e6', 'npm run test:prix']);
    expect(resultats[1]?.sortie).toEqual(['✔ prix affiché : 42,00 €']);
  });
});

describe('moteur : propriétés', () => {
  it('executer ne modifie jamais le dépôt reçu, même gelé profondément', () => {
    const gele = gelerProfond(depotDe(m4));
    expect(() => executer(gele, 'git revert a3f9c2e')).not.toThrow();
    expect(() => executer(gele, 'git reset --hard 9b8c7d6')).not.toThrow();
    expect(() => executer(gele, 'git merge feature/paiement')).not.toThrow();
    expect(() => executer(gele, 'git bisect start')).not.toThrow();
  });

  it('creerDepot ne dépend que de la fiche', () => {
    const a = creerDepot(m3.depot as unknown as FicheDepot);
    const b = creerDepot(m3.depot as unknown as FicheDepot);
    expect(a.branches).toEqual(b.branches);
  });
});
