import { useEffect, useMemo, useState } from 'react';
import { Terminal, type LigneTerminal } from '../../components/terminal/Terminal';
import { GrapheCommits } from '../../components/graphe/GrapheCommits';
import { depotVersGraphe } from '../../components/graphe/adaptateur';
import { BulleMascotte } from '../../components/ui/BulleMascotte';
import { executer } from '../../engine/executer';
import { idHead } from '../../engine/depot';
import type { PropsExercice } from '../registre';
import styles from './TerminalGraphe.module.css';

/** Invite de commande : branche courante, ou HEAD détaché. */
function inviteDe(depot: PropsExercice['depot']): string {
  const tete = depot.head.type === 'branche' ? `(${depot.head.nom})` : `(HEAD detached at ${idHead(depot)})`;
  return `~/startup-demo ${tete} $ `;
}

/** Exercice « Terminal + graphe » : le joueur tape des commandes, le graphe suit en direct. */
export function TerminalGraphe({
  mission,
  depot,
  majDepot,
  compterCommande,
  signalerErreur,
  setPret,
}: PropsExercice) {
  const [lignes, setLignes] = useState<LigneTerminal[]>([]);
  const [nouveau, setNouveau] = useState<string | undefined>(undefined);
  const [historiqueEtapes, setHistoriqueEtapes] = useState(0);

  const completions = useMemo(
    () => [...Object.keys(depot.branches), ...Object.keys(depot.tags)],
    [depot.branches, depot.tags],
  );
  const donnees = useMemo(
    () => depotVersGraphe(depot, nouveau !== undefined ? { nouveau } : {}),
    [depot, nouveau],
  );

  useEffect(() => {
    setPret(historiqueEtapes > 0);
  }, [historiqueEtapes, setPret]);

  const executerLigne = (texte: string) => {
    if (texte === 'clear') {
      setLignes([]);
      return;
    }
    const invite = inviteDe(depot);
    const r = executer(depot, texte);
    const sortie: LigneTerminal[] = [{ type: 'commande', texte: `${invite}${texte}` }];
    if (r.erreur) {
      sortie.push(...r.erreur.texte.map((t) => ({ type: 'erreur' as const, texte: t })));
    } else {
      sortie.push(...r.sortie.map((t) => ({ type: 'sortie' as const, texte: t })));
    }
    setLignes((l) => [...l, ...sortie]);
    if (r.compte) compterCommande();
    if (r.erreur) signalerErreur(r.erreur.explication);
    const commitCree = r.evenements.find((ev) => ev.type === 'commitCree');
    setNouveau(commitCree?.type === 'commitCree' ? commitCree.id : undefined);
    majDepot(r.depot, r.evenements);
    setHistoriqueEtapes((n) => n + 1);
  };

  return (
    <div className={styles.zone}>
      <div className={styles.gauche}>
        <BulleMascotte expression="panique" ton="histoire" texte={mission.histoire} taille={72} />
        <div className={styles.terminal}>
          <Terminal
            lignes={lignes}
            invite={inviteDe(depot)}
            onSubmit={executerLigne}
            completions={completions}
          />
        </div>
      </div>
      <div className={styles.droite}>
        <h2 className={styles.h2}>Historique du dépôt</h2>
        <GrapheCommits donnees={donnees} hauteur={520} />
      </div>
    </div>
  );
}
