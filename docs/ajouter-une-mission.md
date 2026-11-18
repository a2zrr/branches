# Ajouter une mission

Une mission est **un fichier JSON** dans `src/data/missions/`. Aucun écran n'est modifié.

## Pas-à-pas

1. **Choisir l'identifiant** `cN-mM` : `c` pour le chapitre, `m` pour l'ordre. Exemple : `c2-m3`.
2. **Créer le fichier** `src/data/missions/c2-m3.json` à partir du modèle ci-dessous.
3. **Décrire le dépôt de départ** : branches, commits (du plus ancien au plus récent), HEAD, et éventuellement tags,
   fichiers modifiés non commités (`travail`), `prochainsHash` (hash imposés aux prochains commits).
4. **Écrire les conditions de réussite** (`reussite`). Toutes doivent être vraies à VÉRIFIER. Le `message` s'affiche
   dans le bandeau rouge si la condition est fausse. Les conditions d'interdit (`historiqueIntact`, `pointeInchangee`)
   sont vérifiées en premier.
5. **Écrire la solution** : la liste exacte des commandes qui réussissent, une par ligne. `optimal` doit valoir le nombre
   de lignes de `solution`.
6. **Vérifier** : `npm run verif`. Le test des missions contrôle que la fiche est valide, que l'état initial ne réussit
   pas, et que la solution réussit avec exactement `optimal` commandes.

Une mission **brouillon** se déclare avec `"brouillon": true` et seulement `id`, `chapitre`, `ordre`, `titre`, `notion`.
Elle apparaît sur la carte, verrouillée (« Bientôt »), et elle est sautée dans l'ordre de déblocage.

## Modèle commenté

JSON ne permet pas les commentaires : les annotations ci-dessous sont à retirer dans le fichier réel.

```jsonc
{
  "id": "c2-m3",                       // cN-mM, unique
  "chapitre": 2,                       // doit exister dans chapitres.json
  "ordre": 3,                          // unique dans le chapitre
  "titre": "Rends-moi ma branche",     // affiché sur la carte et dans la coque
  "type": "terminal-graphe",           // ou "conflit" (voir l'exercice conflit)
  "notion": "git reflog",              // ajoutée à « Ton Git », débloque les badges liés
  "histoire": "Bon. Kévin a supprimé une branche…", // réplique de Hédi, expression « panique »
  "objectif": "Retrouve la branche supprimée grâce à git reflog.",
  "depot": {
    "branches": [{ "nom": "main", "pointe": "a1b2c3d" }],
    "commits": [
      {
        "id": "1a2b3c4",               // 7 caractères hexadécimaux
        "message": "init: premier commit",
        "branche": "main",             // colonne du graphe
        "parents": [],                 // [] racine, [p] normal, [p1, p2] fusion
        "fichiers": { "README.md": ["# Projet"] }   // contenu complet des fichiers modifiés
      },
      {
        "id": "a1b2c3d",
        "message": "ajoute la page",
        "branche": "main",
        "parents": ["1a2b3c4"],
        "fichiers": { "src/page.js": ["export const page = 1;"] }
        // "supprimes": ["ancien.js"]    // fichiers supprimés par ce commit
      }
    ],
    "head": { "branche": "main" },   // ou { "commit": "1a2b3c4" } pour un HEAD détaché
    // "tags": [{ "nom": "v1", "commit": "1a2b3c4" }],
    // "travail": { "src/page.js": ["modifié"] },   // modifications non commitées
    // "prochainsHash": ["d7e8f90"],                 // hash imposés aux prochains commits
    // "testeur": { "commande": "npm run test:x", "fautif": "a1b2c3d", "sortieOk": "✔ ok", "sortieKo": "✘ ko" }
  },
  "indices": [
    "Premier indice, révélé au premier clic sur INDICE.",
    "Deuxième indice, plus précis."
  ],
  "reussite": [
    {
      "type": "brancheExiste",         // voir la liste des types ci-dessous
      "nom": "demo",
      "message": "La branche demo n'existe pas encore."
    }
  ],
  "optimal": 2,                        // = solution.length
  "appris": [
    "Ce que la mission enseigne, affiché en fin de mission."
  ],
  "solution": [
    "git branch demo",
    "git switch demo"
  ]
}
```

## Types de condition (`reussite`)

| Type | Vrai quand |
|---|---|
| `commitAnnule` | un commit de revert de `cible` est sur `branche` |
| `historiqueIntact` | tous les commits initiaux de `branche` sont encore ses ancêtres |
| `pointeInchangee` | `branche` pointe toujours sur son commit de départ |
| `brancheExiste` | la branche `nom` existe |
| `headSur` | HEAD est sur `branche` |
| `headDetacheSur` | HEAD est détaché sur `commit` |
| `commitsDepuis` | `branche` a au moins `min` commits nouveaux depuis `depuis` |
| `contient` | `commit` est un ancêtre de `branche` |
| `fusionTerminee` | `branche` pointe sur un commit de fusion qui contient `avec` |
| `aucunConflit` | aucun marqueur de conflit dans l'espace de travail |
| `bisectTrouve` | `git bisect` a trouvé `commit` comme premier mauvais commit |
| `fichierContient` | `fichier` contient `ligne` sur `branche` |
| `fichierPropre` | aucune modification en attente |
