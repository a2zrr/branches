import type { PropsExercice } from '../registre';

/** Exercice « conflit » : écran provisoire, remplacé à l'étape 8. */
export function Conflit({ mission }: PropsExercice) {
  return (
    <section className="conflit-provisoire" aria-label="Exercice de conflit">
      <p>Le résolveur de conflit arrive bientôt. ({mission.titre})</p>
    </section>
  );
}
