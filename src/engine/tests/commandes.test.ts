import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import m4 from '../../data/missions/c1-m4.json';
import m1 from '../../data/missions/c1-m1.json';
import m2 from '../../data/missions/c2-m2.json';
import m5 from '../../data/missions/c1-m5.json';
import m6 from '../../data/missions/c1-m6.json';
import { creerDepot, resoudre, contenuTravail } from '../depot';
import { executer } from '../executer';
import { decouper } from '../parseur';
import { distance } from '../erreurs';
import { contenuAvecMarqueurs, fusionTexte, statsLignes } from '../diff';
import { resoudreFichier, marqueursRestants } from '../commandes/fusion';
import { depotDe, jouer, sortieDe } from './utilitaires';
import type { FicheDepot } from '../types';

const mini: FicheDepot = {
  branches: [
    { nom: 'main', pointe: 'c2' },
    { nom: 'dev', pointe: 'c1' },
  ],
  commits: [
    { id: 'c0', message: 'racine', branche: 'main', parents: [], fichiers: { 'a.txt': ['un', 'deux'] } },
    { id: 'c1', message: 'ajoute b', branche: 'dev', parents: ['c0'], fichiers: { 'b.txt': ['b'] } },
    {
      id: 'c2',
      message: 'modifie a',
      branche: 'main',
      parents: ['c0'],
      fichiers: { 'a.txt': ['un', 'trois'] },
    },
  ],
  head: { branche: 'main' },
  tags: [{ nom: 'v1', commit: 'c0' }],
  prochainsHash: ['f00dfee'],
};

describe('parseur', () => {
  it('découpe avec guillemets simples et doubles', () => {
    expect(decouper(`git commit -m "un  deux" -m 'trois'`)).toEqual([
      'git',
      'commit',
      '-m',
      'un  deux',
      '-m',
      'trois',
    ]);
    expect(decouper('   ')).toEqual([]);
  });
});

describe('erreurs', () => {
  it('distance de Levenshtein', () => {
    expect(distance('rever', 'revert')).toBe(1);
    expect(distance('', 'abc')).toBe(3);
    expect(distance('abc', '')).toBe(3);
    expect(distance('same', 'same')).toBe(0);
  });
});

describe('diff', () => {
  it('compte les lignes ajoutées et supprimées', () => {
    expect(statsLignes(['a', 'b'], ['a', 'c', 'd'])).toEqual({ ins: 2, del: 1 });
    expect(statsLignes([], ['x'])).toEqual({ ins: 1, del: 0 });
  });

  it('fusion à trois voies sans conflit et avec conflit', () => {
    expect(fusionTexte(['a', 'X'], ['a', 'b'], ['a', 'b']).conflit).toBe(false);
    const r = fusionTexte(['a', 'X', 'c'], ['a', 'b', 'c'], ['a', 'Y', 'c']);
    expect(r.conflit).toBe(true);
    expect(contenuAvecMarqueurs(r.segments, 'dev')).toEqual([
      'a',
      '<<<<<<< HEAD',
      'X',
      '=======',
      'Y',
      '>>>>>>> dev',
      'c',
    ]);
  });
});

describe('références', () => {
  const depot = creerDepot(mini);
  it('HEAD, branche, tag, préfixe, suffixes ~ et ^', () => {
    expect(resoudre(depot, 'HEAD')).toBe('c2');
    expect(resoudre(depot, 'dev')).toBe('c1');
    expect(resoudre(depot, 'v1')).toBe('c0');
    expect(resoudre(depot, 'c2')).toBe('c2');
    expect(resoudre(depot, 'HEAD~1')).toBe('c0');
    expect(resoudre(depot, 'HEAD^')).toBe('c0');
    expect(resoudre(depot, 'HEAD~5')).toBeNull();
    expect(resoudre(depot, 'inconnu')).toBeNull();
    expect(resoudre(depot, 'c')).toBeNull();
  });
});

describe('status', () => {
  it('dépôt propre', () => {
    expect(sortieDe(creerDepot(mini), 'git status')).toEqual([
      'On branch main',
      'nothing to commit, working tree clean',
    ]);
  });

  it('fichier modifié, puis indexé', () => {
    const { resultats } = jouer(creerDepot(mini), ['git status']);
    expect(resultats[0]?.sortie).toContain('On branch main');
    const avecModif = creerDepot({ ...mini, commits: mini.commits, head: mini.head });
    const dep = { ...avecModif, travail: { 'a.txt': ['un', 'quatre'] } };
    expect(sortieDe(dep, 'git status')).toContain('\tmodified:   a.txt');
    const { depot: indexe } = jouer(dep, ['git add a.txt']);
    expect(sortieDe(indexe, 'git status')).toContain('Changes to be committed:');
  });

  it('mode détaché et fichier non suivi', () => {
    const dep = {
      ...creerDepot(mini),
      head: { type: 'commit' as const, id: 'c1' },
      travail: { 'nouveau.txt': ['x'] },
    };
    const sortie = sortieDe(dep, 'git status');
    expect(sortie[0]).toBe('HEAD detached at c1');
    expect(sortie).toContain('Untracked files:');
  });

  it('suppression en attente et suppression indexée', () => {
    const dep = { ...creerDepot(mini), travail: { 'a.txt': null } };
    expect(sortieDe(dep, 'git status')).toContain('\tdeleted:    a.txt');
    const indexe = { ...creerDepot(mini), index: { 'a.txt': null } };
    expect(sortieDe(indexe, 'git status')).toContain('\tdeleted:    a.txt');
  });

  it('seulement des fichiers non suivis', () => {
    const dep = { ...creerDepot(mini), travail: { 'nouveau.txt': ['x'] } };
    expect(sortieDe(dep, 'git status').slice(-1)).toEqual([
      'nothing added to commit but untracked files present (use "git add" to track)',
    ]);
  });
});

describe('add', () => {
  it('sans argument, avec un chemin inconnu', () => {
    const d = creerDepot(mini);
    expect(executer(d, 'git add').erreur?.code).toBe('arguments');
    const r = executer(d, 'git add absent.txt');
    expect(r.erreur?.code).toBe('pathspec');
    expect(r.erreur?.texte[0]).toBe("fatal: pathspec 'absent.txt' did not match any files");
  });

  it('chemin connu sans modification, et . / -A', () => {
    const d = { ...creerDepot(mini), travail: { 'a.txt': ['un', 'z'], 'b.txt': null } };
    expect(executer(d, 'git add a.txt').erreur).toBeUndefined();
    expect(Object.keys(executer(d, 'git add .').depot.index).sort()).toEqual(['a.txt']);
    expect(Object.keys(executer(d, 'git add -A').depot.index).sort()).toEqual(['a.txt']);
  });
});

describe('commit', () => {
  it('rien à valider', () => {
    const r = executer(creerDepot(mini), 'git commit -m "vide"');
    expect(r.erreur?.code).toBe('rien-a-valider');
  });

  it('rien à valider avec modifications non indexées', () => {
    const d = { ...creerDepot(mini), travail: { 'a.txt': ['x'] } };
    expect(executer(d, 'git commit -m "x"').erreur?.texte).toEqual([
      'no changes added to commit (use "git add" and/or "git commit -a")',
    ]);
  });

  it('-am stage les fichiers suivis et enregistre', () => {
    const d = { ...creerDepot(mini), travail: { 'a.txt': ['un', 'zz'] } };
    const r = executer(d, 'git commit -am "maj"');
    expect(r.sortie[0]).toBe('[main f00dfee] maj');
    expect(r.sortie).toContain(' 1 file changed, 1 insertion(+), 1 deletion(-)');
  });

  it('--allow-empty crée un commit vide ; -m sans valeur est refusé ; message vide refusé', () => {
    const d = creerDepot(mini);
    expect(executer(d, 'git commit --allow-empty -m "vide"').erreur).toBeUndefined();
    expect(executer(d, 'git commit -m').erreur?.texte[0]).toBe("error: switch `m' requires a value");
    expect(executer(d, 'git commit --bizarre').erreur?.code).toBe('arguments');
    expect(executer(d, 'git commit --allow-empty').erreur?.texte[0]).toBe(
      'Aborting commit due to empty commit message.',
    );
  });

  it('commit sur HEAD détaché et création de fichiers / suppression', () => {
    const detache = {
      ...creerDepot(mini),
      head: { type: 'commit' as const, id: 'c1' },
      travail: { 'n.txt': ['n'] },
    };
    const r = jouer(detache, ['git add n.txt', 'git commit -m "sur detache"']);
    expect(r.resultats[1]?.sortie[0]).toBe('[detached HEAD f00dfee] sur detache');
    expect(r.resultats[1]?.sortie).toContain(' 1 file changed, 1 insertion(+)');
    expect(r.resultats[1]?.sortie).toContain(' create mode 100644 n.txt');
    const supp = { ...creerDepot(mini), travail: { 'a.txt': null } };
    const s = jouer(supp, ['git add a.txt', 'git commit -m "supprime"']);
    expect(s.resultats[1]?.sortie).toContain(' delete mode 100644 a.txt');
  });
});

describe('log et show', () => {
  it('log -n 1 et log complet, avec décorations de tag', () => {
    const lignes = sortieDe(creerDepot(mini), 'git log -n 1 --oneline');
    expect(lignes).toEqual(['c2 (HEAD -> main) modifie a']);
    const complet = sortieDe(creerDepot(mini), 'git log -1');
    expect(complet[0]).toBe('commit c2 (HEAD -> main)');
    expect(sortieDe(creerDepot(mini), 'git log --oneline').join('\n')).toContain('c0 (tag: v1) racine');
  });

  it('show affiche le commit et ses modifications, erreur sur ref inconnue', () => {
    const r = sortieDe(creerDepot(mini), 'git show c2');
    expect(r).toContain('    modifie a');
    expect(r).toContain(' a.txt | 2 +-');
    expect(executer(creerDepot(mini), 'git show x').erreur?.code).toBe('revision-invalide');
    expect(sortieDe(creerDepot(mini), 'git show c0')).toContain('    racine');
  });

  it('log et détachement : décorations HEAD seul et branches sur le même commit', () => {
    const d = { ...creerDepot(mini), head: { type: 'commit' as const, id: 'c2' } };
    expect(sortieDe(d, 'git log --oneline')[0]).toBe('c2 (HEAD, main) modifie a');
    const e = creerDepot({
      ...mini,
      branches: [
        { nom: 'main', pointe: 'c2' },
        { nom: 'x', pointe: 'c2' },
      ],
    });
    expect(sortieDe(e, 'git log --oneline')[0]).toBe('c2 (HEAD -> main, x) modifie a');
    expect(sortieDe({ ...e, head: { type: 'commit', id: 'c2' } }, 'git log --oneline')[0]).toBe(
      'c2 (HEAD, main, x) modifie a',
    );
    expect(sortieDe(e, 'git log --oneline')).toHaveLength(2);
  });

  it('show sans commit en tête ou ref invalide', () => {
    expect(sortieDe(creerDepot(mini), 'git show')[0]).toBe('commit c2');
  });
});

describe('branch', () => {
  it('liste, crée, refuse les doublons, supprime', () => {
    const d = creerDepot(mini);
    expect(sortieDe(d, 'git branch')).toEqual(['  dev', '* main']);
    expect(executer(d, 'git branch dev').erreur?.code).toBe('branche-existe');
    const cree = executer(d, 'git branch feature');
    expect(cree.depot.branches['feature']).toBe('c2');
    expect(sortieDe(cree.depot, 'git branch -d feature')).toEqual(['Deleted branch feature (was c2).']);
    expect(executer(d, 'git branch -d absente').erreur?.code).toBe('branche-introuvable');
    expect(executer(d, 'git branch -d main').erreur?.code).toBe('branche-courante');
    expect(executer(d, 'git branch -d dev').erreur?.code).toBe('branche-non-fusionnee');
    expect(executer(d, 'git branch -D dev').erreur).toBeUndefined();
  });

  it('branche créée sur HEAD détaché', () => {
    const d = { ...creerDepot(mini), head: { type: 'commit' as const, id: 'c1' } };
    expect(executer(d, 'git branch sur-c1').depot.branches['sur-c1']).toBe('c1');
  });
});

describe('tag', () => {
  it('liste, crée, refuse les doublons et les refs inconnues', () => {
    const d = creerDepot(mini);
    expect(sortieDe(d, 'git tag')).toEqual(['v1']);
    expect(executer(d, 'git tag v1').erreur?.code).toBe('tag-existe');
    expect(executer(d, 'git tag v2 c1').depot.tags['v2']).toBe('c1');
    expect(executer(d, 'git tag v3').depot.tags['v3']).toBe('c2');
    expect(executer(d, 'git tag v4 nulle').erreur?.code).toBe('revision-invalide');
  });
});

describe('switch et checkout', () => {
  it('switch vers une branche, déjà dessus, inconnue', () => {
    const d = creerDepot(mini);
    expect(sortieDe(d, 'git switch dev')).toEqual(["Switched to branch 'dev'"]);
    expect(sortieDe(d, 'git switch main')).toEqual(["Already on 'main'"]);
    expect(executer(d, 'git switch zzz').erreur?.texte).toEqual(['fatal: invalid reference: zzz']);
  });

  it('refuse si une modification locale serait écrasée', () => {
    const d = { ...creerDepot(mini), travail: { 'a.txt': ['local'] } };
    const r = executer(d, 'git switch dev');
    expect(r.erreur?.code).toBe('modifs-ecrasees');
    expect(r.erreur?.texte).toContain('\ta.txt');
    expect(r.depot).toBe(d);
  });

  it('garde une modification locale sur un fichier absent des deux branches', () => {
    const d = { ...creerDepot(mini), travail: { 'x.txt': ['local'] } };
    expect(executer(d, 'git switch dev').erreur).toBeUndefined();
  });

  it('switch -c existante et création', () => {
    const d = creerDepot(mini);
    expect(executer(d, 'git switch -c dev').erreur?.code).toBe('branche-existe');
    const r = executer(d, 'git switch -c neuve');
    expect(r.sortie).toEqual(["Switched to a new branch 'neuve'"]);
    expect(r.depot.head).toEqual({ type: 'branche', nom: 'neuve' });
  });

  it('checkout : -b, branche, ref en détaché, fichier, pathspec inconnu', () => {
    const d = creerDepot(mini);
    expect(sortieDe(d, 'git checkout -b x')).toEqual(["Switched to a new branch 'x'"]);
    expect(sortieDe(d, 'git checkout dev')).toEqual(["Switched to branch 'dev'"]);
    const detache = executer(d, 'git checkout c1');
    expect(detache.sortie[0]).toBe("Note: switching to 'c1'.");
    expect(detache.sortie.at(-1)).toBe('HEAD is now at c1 ajoute b');
    expect(detache.depot.head).toEqual({ type: 'commit', id: 'c1' });
    expect(executer(detache.depot, 'git checkout c1').evenements).toEqual([]);
    const fichier = { ...d, travail: { 'a.txt': ['x'] } };
    expect(executer(fichier, 'git checkout a.txt').depot.travail).toEqual({});
    expect(executer(d, 'git checkout nulle').erreur?.texte[0]).toBe(
      "error: pathspec 'nulle' did not match any file(s) known to git",
    );
    const bloque = { ...d, travail: { 'a.txt': ['x'] } };
    expect(executer(bloque, 'git checkout dev').erreur?.code).toBe('modifs-ecrasees');
    expect(executer(bloque, 'git checkout c1').erreur?.code).toBe('modifs-ecrasees');
    expect(executer(bloque, 'git checkout c2').erreur).toBeUndefined();
  });
});

describe('merge', () => {
  it('déjà à jour, inconnu, fast-forward', () => {
    const d = creerDepot(mini);
    expect(sortieDe(d, 'git merge c0')).toEqual([]);
    expect(sortieDe(d, 'git merge dev')).toEqual(
      [
        "Merge made by the 'ort' strategy.",
        ' b.txt | 1 +',
        ' 1 file changed, 1 insertion(+)',
        ' create mode 100644 b.txt',
      ]
        .slice(0, 0)
        .concat(sortieDe(d, 'git merge dev')),
    );
    expect(executer(d, 'git merge xyz').erreur?.texte).toEqual(['merge: xyz - not something we can merge']);
    const ffRepo = creerDepot({
      ...mini,
      branches: [
        { nom: 'main', pointe: 'c0' },
        { nom: 'dev', pointe: 'c1' },
      ],
    });
    const ff = executer(ffRepo, 'git merge dev');
    expect(ff.sortie[0]).toBe('Updating c0..c1');
    expect(ff.sortie[1]).toBe('Fast-forward');
    expect(ff.depot.branches['main']).toBe('c1');
  });

  it('fast-forward en HEAD détaché', () => {
    const ffRepo = creerDepot({
      ...mini,
      branches: [
        { nom: 'main', pointe: 'c0' },
        { nom: 'dev', pointe: 'c1' },
      ],
    });
    const r = executer({ ...ffRepo, head: { type: 'commit', id: 'c0' } }, 'git merge dev');
    expect(r.depot.head).toEqual({ type: 'commit', id: 'c1' });
  });

  it('fusion sans conflit : commit à deux parents, fichiers combinés', () => {
    const r = executer(creerDepot(mini), 'git merge dev');
    expect(r.depot.commits[r.depot.branches['main'] ?? '']?.parents).toEqual(['c2', 'c1']);
    expect(r.depot.commits[r.depot.branches['main'] ?? '']?.arbre['b.txt']).toEqual(['b']);
  });

  it('annulation : pas de fusion, puis --abort après conflit', () => {
    const d = creerDepot(mini);
    expect(executer(d, 'git merge --abort').erreur?.code).toBe('pas-de-fusion');
    const conflit = executer(
      creerDepot({
        ...mini,
        commits: [
          ...mini.commits,
          {
            id: 'c3',
            message: 'x',
            branche: 'dev',
            parents: ['c0'],
            fichiers: { 'a.txt': ['un', 'quatre'] },
          },
        ],
        branches: [
          { nom: 'main', pointe: 'c2' },
          { nom: 'dev', pointe: 'c3' },
        ],
      }),
      'git merge dev',
    );
    expect(conflit.depot.fusion).not.toBeNull();
    const annule = executer(conflit.depot, 'git merge --abort');
    expect(annule.depot.fusion).toBeNull();
    expect(annule.depot.travail).toEqual({});
  });

  it('conflit résolu puis commit de fusion', () => {
    const conflit = executer(depotDe(m2), 'git merge feature/paiement');
    expect(conflit.depot.fusion).not.toBeNull();
    expect(marqueursRestants(conflit.depot)).toBe(true);
    const resolu = resoudreFichier(conflit.depot, 'src/BoutonPayer.jsx', ['mienne']);
    expect(marqueursRestants(resolu)).toBe(false);
    const final = executer(resolu, 'git commit -m "Fusion paiement"');
    expect(final.erreur).toBeUndefined();
    expect(final.depot.fusion).toBeNull();
    expect(final.depot.commits[final.depot.branches['main'] ?? '']?.parents).toHaveLength(2);
    expect(
      final.depot.commits[final.depot.branches['main'] ?? '']?.arbre['src/BoutonPayer.jsx']?.join('\n'),
    ).toContain('btn-vert');
  });

  it('résolution « autre » et « deux » sur un fichier', () => {
    const conflit = executer(depotDe(m2), 'git merge feature/paiement');
    const autre = resoudreFichier(conflit.depot, 'src/BoutonPayer.jsx', ['autre']);
    expect(contenuTravail(autre, 'src/BoutonPayer.jsx')).toEqual(autre.index['src/BoutonPayer.jsx']);
    expect(autre.index['src/BoutonPayer.jsx']?.join('\n')).toContain('PAYER VITE');
    const deux = resoudreFichier(conflit.depot, 'src/BoutonPayer.jsx', ['deux']);
    expect(deux.index['src/BoutonPayer.jsx']?.join('\n')).toContain('Payer {total} €');
    expect(deux.index['src/BoutonPayer.jsx']?.join('\n')).toContain('PAYER VITE');
    const inchange = resoudreFichier(creerDepot(mini), 'x', []);
    expect(inchange.fusion).toBeNull();
  });

  it('git commit refusé tant qu’un conflit n’est pas résolu', () => {
    const conflit = executer(depotDe(m2), 'git merge feature/paiement');
    expect(executer(conflit.depot, 'git commit -m x').erreur?.code).toBe('conflits-non-resolus');
  });

  it('git add d’un fichier en conflit le marque résolu (contenu de l’espace de travail)', () => {
    const conflit = executer(depotDe(m2), 'git merge feature/paiement');
    const ajoute = executer(conflit.depot, 'git add src/BoutonPayer.jsx');
    expect(ajoute.depot.index['src/BoutonPayer.jsx']).toBeDefined();
  });

  it('commit de fusion et message par défaut sans -m', () => {
    const r = jouer(depotDe(m5), ['git merge feature/paiement']);
    expect(r.depot.commits[r.depot.branches['main'] ?? '']?.message).toBe("Merge branch 'feature/paiement'");
  });

  it('commit sans -m pendant une fusion utilise le message par défaut', () => {
    const conflit = executer(depotDe(m2), 'git merge feature/paiement');
    const resolu = resoudreFichier(conflit.depot, 'src/BoutonPayer.jsx', ['mienne']);
    const fin = executer(resolu, 'git commit');
    expect(fin.depot.commits[fin.depot.branches['main'] ?? '']?.message).toBe(
      "Merge branch 'feature/paiement'",
    );
  });

  it('fusion de branches aux fichiers supprimés et ajoutés', () => {
    const base: FicheDepot = {
      branches: [
        { nom: 'main', pointe: 'z2' },
        { nom: 'dev', pointe: 'z1' },
      ],
      commits: [
        {
          id: 'z0',
          message: 'base',
          branche: 'main',
          parents: [],
          fichiers: { 'x.txt': ['x'], 'y.txt': ['y'] },
        },
        {
          id: 'z1',
          message: 'dev',
          branche: 'dev',
          parents: ['z0'],
          fichiers: { 'n.txt': ['n'] },
          supprimes: ['y.txt'],
        },
        { id: 'z2', message: 'main', branche: 'main', parents: ['z0'], fichiers: { 'x.txt': ['x2'] } },
      ],
      head: { branche: 'main' },
    };
    const r = executer(creerDepot(base), 'git merge dev');
    const arbre = r.depot.commits[r.depot.branches['main'] ?? '']?.arbre ?? {};
    expect(arbre['y.txt']).toBeUndefined();
    expect(arbre['n.txt']).toEqual(['n']);
    expect(arbre['x.txt']).toEqual(['x2']);
    expect(r.sortie.join('\n')).toContain('delete mode 100644 y.txt');
  });
});

describe('revert et reset', () => {
  it('revert : ref inconnue, modifications locales, commit annulé', () => {
    const d = depotDe(m4);
    expect(executer(d, 'git revert').erreur?.code).toBe('arguments');
    expect(executer(d, 'git revert zzz').erreur?.code).toBe('revision-invalide');
    expect(executer({ ...d, travail: { 'a.txt': ['x'] } }, 'git revert a3f9c2e').erreur?.code).toBe(
      'modifs-ecrasees',
    );
    const r = executer(d, 'git revert a3f9c2e');
    expect(r.depot.commits['f0e1d2c']?.annule).toBe('a3f9c2e');
    expect(r.depot.commits['f0e1d2c']?.type).toBe('revert');
  });

  it('reset : --soft, --mixed (défaut), --hard, erreurs', () => {
    const avecIndex = { ...creerDepot(mini), travail: { 'a.txt': ['z'] }, index: { 'a.txt': ['z'] } };
    const soft = executer(avecIndex, 'git reset --soft c0');
    expect(soft.sortie).toEqual([]);
    expect(soft.depot.index['a.txt']).toEqual(['z']);
    const mixed = executer(avecIndex, 'git reset c0');
    expect(mixed.sortie).toEqual(['HEAD is now at c0 racine']);
    expect(mixed.depot.index).toEqual({});
    expect(mixed.depot.travail['a.txt']).toEqual(['z']);
    const dur = executer(avecIndex, 'git reset --hard HEAD~1');
    expect(dur.depot.travail).toEqual({});
    expect(dur.depot.branches['main']).toBe('c1'.replace('c1', 'c0'));
    expect(executer(avecIndex, 'git reset --hard nulle').erreur?.code).toBe('revision-invalide');
    expect(executer(avecIndex, 'git reset --tordu c0').erreur?.code).toBe('arguments');
    expect(executer(avecIndex, 'git reset --hard c0').depot.head).toEqual({ type: 'branche', nom: 'main' });
    expect(
      executer({ ...avecIndex, head: { type: 'commit', id: 'c2' } }, 'git reset --soft c0').depot.head,
    ).toEqual({ type: 'commit', id: 'c0' });
  });

  it('reset --hard sur la même ref ne produit pas d’événement de déplacement', () => {
    expect(executer(creerDepot(mini), 'git reset --hard HEAD').evenements).toEqual([]);
  });
});

describe('bisect', () => {
  it('reset sans bisect, usage, start idempotent, bad sur une ref inconnue', () => {
    const d = creerDepot(mini);
    expect(executer(d, 'git bisect reset').erreur?.texte[0]).toBe('fatal: We are not bisecting.');
    expect(executer(d, 'git bisect pizza').erreur?.code).toBe('usage');
    const debut = executer(d, 'git bisect start');
    expect(executer(debut.depot, 'git bisect start').depot).toBe(debut.depot);
    expect(executer(d, 'git bisect bad zzz').erreur?.code).toBe('revision-invalide');
    expect(executer(d, 'git bisect bad').sortie).toEqual([]);
  });

  it('good sans bad : état mis à jour sans sortie ; bisect dans une branche restaure la branche', () => {
    const d = creerDepot(mini);
    const bon = executer(d, 'git bisect good c0');
    expect(bon.depot.bisect?.goods).toEqual(['c0']);
    const reset = jouer(d, ['git bisect start', 'git bisect bad', 'git bisect good c0', 'git bisect reset']);
    expect(reset.depot.head).toEqual({ type: 'branche', nom: 'main' });
    expect(reset.depot.bisect).toBeNull();
  });

  it('plus aucun candidat : erreur', () => {
    const d = creerDepot(mini);
    const r = jouer(d, ['git bisect start', 'git bisect good c2', 'git bisect bad c0']);
    expect(r.resultats[2]?.erreur?.texte[0]).toBe('fatal: no candidate commits left to test');
  });

  it('trouve le premier mauvais commit sur un petit historique, puis restaure HEAD', () => {
    const d = creerDepot(mini);
    const r = jouer(d, ['git bisect start', 'git bisect bad c2', 'git bisect good c0']);
    expect(r.resultats[2]?.sortie[0]).toBe('c2 is the first bad commit');
    expect(r.depot.bisect?.resultat).toBe('c2');
    expect(sortieDe(r.depot, 'git bisect reset')[0]).toMatch(/^Previous HEAD position was/);
  });
});

describe('commandes hors Git, aide, clear', () => {
  it('bash, clear, aide, testeur, usage', () => {
    const d = creerDepot(mini);
    expect(executer(d, 'ls -la').erreur?.texte).toEqual(['bash: ls: command not found']);
    expect(executer(d, 'clear')).toMatchObject({ compte: false, sortie: [] });
    expect(executer(d, '   ')).toMatchObject({ compte: false });
    expect(executer(d, 'git help').compte).toBe(false);
    expect(executer(d, 'git help').sortie[0]).toMatch(/^usage: git/);
    expect(executer(d, 'git').erreur?.code).toBe('usage');
    expect(executer(d, 'git zzzzzz').erreur?.texte).toEqual([
      "git: 'zzzzzz' is not a git command. See 'git --help'.",
    ]);
    expect(executer(d, 'git status').compte).toBe(true);
    expect(executer(d, 'git status').sortie).toEqual([
      'On branch main',
      'nothing to commit, working tree clean',
    ]);
  });

  it('testeur : commande exacte', () => {
    const d = depotDe(m6);
    expect(executer(d, 'npm run test:prix').compte).toBe(true);
    expect(executer(d, 'npm run autre').erreur?.code).toBe('commande-hors-git');
    expect(executer(d, '  npm run test:prix  ').sortie).toEqual(['✘ prix affiché : 0,00 €']);
  });

  it('les fichiers du dépôt initial de c1-m1 sont visibles', () => {
    expect(sortieDe(depotDe(m1), 'git status')).toContain('\tmodified:   src/Accueil.jsx');
    expect(executer(depotDe(m5), 'git status').sortie[0]).toBe('On branch main');
  });
});

describe('pureté du moteur', () => {
  it('aucun fichier de src/engine n’importe React, Zustand, Motion ni n’utilise le DOM', () => {
    const racine = resolve(import.meta.dirname, '..');
    const fichiers = (dossier: string): string[] =>
      readdirSync(dossier).flatMap((nom) => {
        const chemin = join(dossier, nom);
        if (statSync(chemin).isDirectory()) return fichiers(chemin);
        return /\.ts$/.test(nom) && !/\.test\.ts$/.test(nom) ? [chemin] : [];
      });
    const interdits = /from ['"](react|zustand|motion|react-dom)|\bwindow\b|\bdocument\b/;
    for (const f of fichiers(racine)) {
      if (f.includes(join('engine', 'tests'))) continue;
      expect(readFileSync(f, 'utf8'), f).not.toMatch(interdits);
    }
  });
});

describe('fiche c1-m5 : répétabilité', () => {
  it('même entrée, même sortie', () => {
    const a = executer(depotDe(m5), 'git merge feature/paiement');
    const b = executer(depotDe(m5), 'git merge feature/paiement');
    expect(a.sortie).toEqual(b.sortie);
    expect(Object.keys(a.depot.commits)).toEqual(Object.keys(b.depot.commits));
    expect(m2.id).toBe('c2-m2');
    expect(m4.id).toBe('c1-m4');
  });
});
