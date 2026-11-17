# Branchés

Branchés est un jeu web pour apprendre Git. Le joueur est un développeur junior chez Pivot & Co, une petite start-up.
Chaque chapitre est une galère : le projet est cassé, la démo est ce soir. Chaque mission se résout avec de vraies
commandes Git, tapées dans un terminal, pendant que le graphe des commits se dessine en direct. Hédi, le chef de projet,
raconte la galère, donne les indices et réagit.

- **Aucun compte, aucun serveur.** Ta partie est sauvegardée dans ton navigateur. Un bouton permet d'exporter et d'importer
  la progression (fichier JSON), par exemple pour changer de navigateur.
- **Git est simulé** dans le navigateur par un moteur TypeScript. Les sorties reproduisent celles de Git, en anglais.
- **Interface en français**, en tutoiement. Desktop d'abord (1440 × 900, largeur minimale 1280 px).
- **Mode clair par défaut**, mode sombre en option.
- **Tout est piloté par les données** : une mission est un fichier JSON, un chapitre une entrée de `chapitres.json`.

## Lancer en local

Prérequis : Node.js 20 ou plus récent, et Google Chrome (ou Chromium) pour les tests de bout en bout.

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement (routes `/dev/design-system` et `/dev/graphe` incluses) |
| `npm run build` | Vérification des types puis build de production dans `dist/` |
| `npm run preview` | Sert le build de production |
| `npm run lint` | ESLint (typescript-eslint, react-hooks, jsx-a11y), zéro avertissement |
| `npm run typecheck` | Vérification des types TypeScript (`strict`, `noUncheckedIndexedAccess`) |
| `npm run test` | Tests unitaires (Vitest, Testing Library, jsdom) |
| `npm run test:e2e` | Tests de bout en bout (Playwright, Chrome système, deux serveurs) |
| `npm run verif` | `lint` + `typecheck` + `test` |
| `npm run verifier:commits` | Vérifie le format des messages de commit |

Les tests de bout en bout utilisent le Chrome installé sur la machine (`channel: 'chrome'`). Pour un autre navigateur
Chromium, définis la variable `PW_CHANNEL`.

## Architecture

```
src/
├── engine/          moteur Git simulé : TypeScript pur, sans React, Zustand, Motion ni DOM
│   ├── executer.ts  executer(depot, ligne) → { depot, sortie, erreur?, evenements }
│   ├── commandes/   status, add, commit, log, branch, switch, checkout, merge, revert, reset, bisect, tag, show…
│   └── …            depot.ts (références, arbres), diff.ts (fusion à trois voies), erreurs.ts, parseur.ts
├── game/            règles du jeu
│   ├── schemas.ts   validation zod des fiches
│   ├── missions.ts  chargement de src/data/missions/*.json
│   ├── reussite.ts  évaluation des conditions de réussite
│   ├── regles.ts    étoiles, XP, déblocage, « Ton Git », badges
│   └── store.ts     progression persistée (Zustand, clé « branches:v1 »), export et import
├── exercises/       registre des types d'exercice (terminal-graphe, conflit)
├── components/      design system : ui/, mascotte/ (Hédi), graphe/ (layout pur + rendu), terminal/, conflit/
├── screens/         accueil, carte, coque de jeu, fin de mission, paramètres
└── data/missions/   fiches JSON des missions, chapitres.json, badges.json
e2e/                 tests Playwright (prod : build de production ; dev : serveur de développement)
design/              référence visuelle et fonctionnelle (lecture seule)
```

Le moteur ne modifie jamais le dépôt qu'il reçoit : `executer` renvoie un nouveau dépôt et des événements, que le graphe
utilise pour ses animations. Les couleurs n'apparaissent que dans `src/styles/tokens.css` : les composants utilisent
des variables CSS, et un test vérifie qu'aucune couleur n'est écrite en dur.

## Ajouter une mission, un chapitre, un type d'exercice

- **Une mission** : un fichier JSON dans `src/data/missions/`. Pas-à-pas et modèle commenté dans
  [`docs/AJOUTER-UNE-MISSION.md`](docs/AJOUTER-UNE-MISSION.md).
- **Un chapitre** : une entrée dans `src/data/missions/chapitres.json`.
- **Un type d'exercice** : un composant dans `src/exercises/` et une ligne dans `src/exercises/registre.ts`. La coque
  n'a pas besoin d'être modifiée.

Après un ajout, `npm run verif` valide la fiche : schéma, identifiants uniques, solution qui réussit, nombre de
commandes égal à l'optimal.

## Déploiement

Le site est statique. Il se déploie sur Vercel : `vercel.json` réécrit toutes les routes vers `index.html`.

1. Créer un dépôt sur GitHub, puis y pousser le code (`git remote add origin …`, `git push -u origin main`).
2. Importer le dépôt dans Vercel. Les réglages par défaut conviennent : commande de build `npm run build`, dossier de
   sortie `dist`.

## Licence

Projet privé.
