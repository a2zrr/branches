// Validation zod des fiches de mission. Miroir de design/missions/schema.ts (types dans ./types.ts).
import { z } from 'zod';

export const SchemaChapitre = z.object({
  numero: z.number().int().positive(),
  titre: z.string().min(1),
  sousTitre: z.string(),
  couleur: z.string().optional(),
  couleurArete: z.string().optional(),
  bientot: z.boolean().optional(),
  vignette: z
    .object({
      expression: z.enum(['accueillant', 'panique', 'pensif', 'fier']),
      accessoire: z.enum(['terminal', 'message', 'calendrier']),
      teinte: z.enum(['bleu', 'violet', 'orange']),
    })
    .optional(),
});

export const SchemaCommit = z.object({
  id: z.string().min(1),
  message: z.string().min(1),
  branche: z.string().min(1),
  parents: z.array(z.string()),
  auteur: z.string().optional(),
  fichiers: z.record(z.string(), z.array(z.string())).optional(),
  supprimes: z.array(z.string()).optional(),
  type: z.literal('revert').optional(),
  annule: z.string().optional(),
});

export const SchemaTesteur = z.object({
  commande: z.string().min(1),
  fautif: z.string().min(1),
  sortieOk: z.string(),
  sortieKo: z.string(),
});

export const SchemaDepot = z.object({
  branches: z.array(z.object({ nom: z.string().min(1), pointe: z.string().min(1) })),
  commits: z.array(SchemaCommit),
  head: z.union([z.object({ branche: z.string().min(1) }), z.object({ commit: z.string().min(1) })]),
  tags: z.array(z.object({ nom: z.string().min(1), commit: z.string().min(1) })).optional(),
  travail: z.record(z.string(), z.array(z.string())).optional(),
  prochainsHash: z.array(z.string()).optional(),
  testeur: SchemaTesteur.optional(),
});

const SchemaCondition = z.discriminatedUnion('type', [
  z.object({ type: z.literal('commitAnnule'), cible: z.string(), branche: z.string(), message: z.string() }),
  z.object({ type: z.literal('historiqueIntact'), branche: z.string(), message: z.string() }),
  z.object({ type: z.literal('pointeInchangee'), branche: z.string(), message: z.string() }),
  z.object({ type: z.literal('brancheExiste'), nom: z.string(), message: z.string() }),
  z.object({ type: z.literal('headSur'), branche: z.string(), message: z.string() }),
  z.object({ type: z.literal('headDetacheSur'), commit: z.string(), message: z.string() }),
  z.object({
    type: z.literal('commitsDepuis'),
    branche: z.string(),
    depuis: z.string(),
    min: z.number().int(),
    message: z.string(),
  }),
  z.object({ type: z.literal('contient'), branche: z.string(), commit: z.string(), message: z.string() }),
  z.object({ type: z.literal('fusionTerminee'), branche: z.string(), avec: z.string(), message: z.string() }),
  z.object({ type: z.literal('aucunConflit'), message: z.string() }),
  z.object({ type: z.literal('bisectTrouve'), commit: z.string(), message: z.string() }),
  z.object({
    type: z.literal('fichierContient'),
    fichier: z.string(),
    ligne: z.string(),
    branche: z.string(),
    message: z.string(),
  }),
  z.object({ type: z.literal('fichierPropre'), message: z.string() }),
]);

const SchemaExerciceConflit = z.object({
  commandeDeDepart: z.string(),
  fichier: z.string(),
  choixAcceptes: z.array(z.enum(['mienne', 'autre', 'deux'])),
  reactions: z.object({ mienne: z.string(), autre: z.string(), deux: z.string() }),
});

const baseMission = z.object({
  id: z.string().regex(/^c\d+-m\d+$/, 'identifiant de la forme cN-mM'),
  chapitre: z.number().int().positive(),
  ordre: z.number().int().positive(),
  titre: z.string().min(1),
  notion: z.string().min(1),
});

export const SchemaMissionJouable = baseMission.extend({
  type: z.enum(['terminal-graphe', 'conflit']),
  histoire: z.string().min(1),
  objectif: z.string().min(1),
  depot: SchemaDepot,
  indices: z.array(z.string()),
  reussite: z.array(SchemaCondition).min(1),
  optimal: z.number().int().nonnegative(),
  appris: z.array(z.string()),
  solution: z.array(z.string()),
  exercice: SchemaExerciceConflit.optional(),
});

export const SchemaMissionBrouillon = baseMission.extend({
  brouillon: z.literal(true),
  histoire: z.string().optional(),
  objectif: z.string().optional(),
});

export const SchemaMission = z.union([SchemaMissionJouable, SchemaMissionBrouillon]);

export const SchemaBadge = z.object({
  id: z.string().min(1),
  nom: z.string().min(1),
  notion: z.string().min(1),
  couleur: z.string(),
  couleurArete: z.string(),
  icone: z.string(),
});

export type MissionValidee = z.infer<typeof SchemaMission>;
export type MissionJouableValidee = z.infer<typeof SchemaMissionJouable>;
export type ChapitreValide = z.infer<typeof SchemaChapitre>;
export type BadgeValide = z.infer<typeof SchemaBadge>;
