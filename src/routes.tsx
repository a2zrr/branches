import { createBrowserRouter } from 'react-router';
import { Accueil } from './screens/Accueil';
import { Carte } from './screens/Carte';
import { CoqueJeu } from './screens/CoqueJeu';
import { FinMission } from './screens/FinMission';
import { OuvrirParametres } from './screens/OuvrirParametres';
import { Introuvable } from './screens/Introuvable';
import { DesignSystem } from './screens/dev/DesignSystem';
import { Graphe } from './screens/dev/Graphe';

const routesDeveloppement = import.meta.env.DEV
  ? [
      { path: '/dev/design-system', Component: DesignSystem },
      { path: '/dev/graphe', Component: Graphe },
    ]
  : [];

export const routeur = createBrowserRouter([
  { path: '/', Component: Accueil },
  { path: '/carte', Component: Carte },
  { path: '/mission/:id', Component: CoqueJeu },
  { path: '/mission/:id/fin', Component: FinMission },
  { path: '/parametres', Component: OuvrirParametres },
  ...routesDeveloppement,
  { path: '*', Component: Introuvable },
]);
