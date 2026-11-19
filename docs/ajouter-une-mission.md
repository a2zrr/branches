# Ajouter une mission

Une mission est un **fichier JSON** dans `src/data/missions/`, nommé `cN-mM.json` (N : chapitre, M : ordre). Rien d'autre à coder : la fiche est validée au chargement avec zod (`src/game/schemas.ts`), et un test automatique la rejoue avec sa solution.

Les chapitres sont dans `src/data/missions/chapitres.json`, les badges dans `badges.json`.

## Champs d'une mission jouable

| Champ | Rôle |
|---|---|
| `id` | identifiant de la forme `cN-mM`, unique |
| `chapitre` | numéro du chapitre (entier positif) |
| `ordre` | place dans le chapitre (entier positif) ; le couple (`chapitre`, `ordre`) est unique |
| `titre` | le nom affiché sur la carte |
| `notion` | ce que la mission enseigne : alimente « Ton Git » et les badges |
| `type` | `terminal-graphe` (on tape des commandes) ou `conflit` (on résout un conflit de merge) |
| `histoire` | la réplique de Hédi au début de la mission |
| `objectif` | ce qu'il faut réussir, en une phrase |
| `depot` | l'état de départ du dépôt (voir ci-dessous) |
| `indices` | la liste des indices, révélés un par un |
| `reussite` | au moins une condition, toutes doivent être vraies (voir plus bas) |
| `optimal` | le nombre de commandes de la solution de référence |
| `appris` | ce que le joueur retient, affiché en fin de mission |
| `solution` | les commandes de la solution de référence ; sa longueur est **égale** à `optimal` |
| `exercice` | requis pour `type: "conflit"` (fichier, choix acceptés, réactions) |

## État de départ : `depot`

- `branches` : `[{ "nom": "main", "pointe": "<id>" }]`, dans l'ordre des colonnes du graphe.
- `commits` : du plus ancien au plus récent. Chaque commit a `id`, `message`, `branche`, `parents` (`[]` pour la racine, un parent, ou deux pour une fusion) et, facultatif, `fichiers` (contenu complet des fichiers).
- `head` : `{ "branche": "main" }`, ou `{ "commit": "<id>" }` pour un HEAD détaché.
- `travail` (facultatif) : fichiers modifiés non enregistrés.
- `prochainsHash` (facultatif) : identifiants imposés aux prochains commits créés.
- `tags`, `testeur` (facultatifs) : pour les étiquettes et la recherche de bug.

## Conditions de réussite : `reussite`

Toutes les conditions doivent être vraies quand le joueur clique sur VÉRIFIER. Chaque condition a un `message`, affiché si elle est fausse.

| `type` | Vérifie que… |
|---|---|
| `commitAnnule` | un commit de revert de `cible` est sur `branche` |
| `historiqueIntact` | les commits initiaux de `branche` sont encore ses ancêtres |
| `pointeInchangee` | `branche` pointe toujours au même commit qu'au départ |
| `brancheExiste` | la branche `nom` existe |
| `headSur` | HEAD est sur `branche` |
| `headDetacheSur` | HEAD est détaché sur `commit` |
| `commitsDepuis` | `branche` a au moins `min` commits après `depuis` |
| `contient` | `commit` est un ancêtre de la pointe de `branche` |
| `fusionTerminee` | la pointe de `branche` est une fusion qui contient `avec` |
| `aucunConflit` | aucun marqueur de conflit n'est resté |
| `bisectTrouve` | le commit fautif `commit` est identifié |
| `fichierContient` | `fichier` contient `ligne` sur `branche` |
| `fichierPropre` | aucune modification n'est en attente |

## Exemple de fiche jouable minimale

Inspirée de `c1-m1`, avec un chapitre fictif `c9` pour ne pas toucher au jeu. Le joueur doit enregistrer une modification en un commit.

```json
{
  "id": "c9-m1",
  "chapitre": 9,
  "ordre": 1,
  "titre": "Ton premier commit",
  "notion": "git commit",
  "type": "terminal-graphe",
  "histoire": "Enregistre la correction du titre avant que je l'oublie. Moi, j'oublie tout.",
  "objectif": "Enregistre la modification de src/Accueil.jsx dans un nouveau commit sur main.",
  "depot": {
    "branches": [{ "nom": "main", "pointe": "1a2b3c4" }],
    "commits": [
      {
        "id": "1a2b3c4",
        "message": "init: premier commit",
        "branche": "main",
        "parents": [],
        "fichiers": { "src/Accueil.jsx": ["export function Accueil() {", "  return <h1>Pivot & Co</h1>;", "}"] }
      }
    ],
    "head": { "branche": "main" },
    "travail": { "src/Accueil.jsx": ["export function Accueil() {", "  return <h1>Pivot & Co !</h1>;", "}"] },
    "prochainsHash": ["c0d1e2f"]
  },
  "indices": [
    "Un commit se fait en deux temps : on choisit les fichiers avec git add, puis on les enregistre avec git commit."
  ],
  "reussite": [
    {
      "type": "commitsDepuis",
      "branche": "main",
      "depuis": "1a2b3c4",
      "min": 1,
      "message": "Aucun nouveau commit sur main pour l'instant."
    },
    {
      "type": "fichierPropre",
      "message": "Il reste des modifications non enregistrées. Pense à git add."
    }
  ],
  "optimal": 2,
  "appris": [
    "git add prépare les fichiers à enregistrer.",
    "git commit -m \"…\" enregistre une photo du projet avec un message."
  ],
  "solution": ["git add src/Accueil.jsx", "git commit -m \"fix: corrige le titre de l'accueil\""]
}
```

## Fiches « brouillon »

Une fiche avec `"brouillon": true` apparaît sur la carte, avec la mention « Bientôt », mais elle n'est pas jouable. Elle n'a besoin que de `id`, `chapitre`, `ordre`, `titre`, `notion` et `brouillon`. Elle est ignorée par la règle de déblocage.

## Comment la mission est testée

`src/game/missions.test.ts` vérifie, pour chaque mission jouable :
1. l'état de départ **ne réussit pas** encore ;
2. exécuter la `solution` **réussit** ;
3. `solution` a exactement `optimal` éléments.

Les fiches invalides font échouer le chargement avec le nom du fichier et le champ fautif.
