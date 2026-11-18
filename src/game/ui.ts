// État d'interface non persisté : le panneau Paramètres est ouvert ou fermé. Rien n'est sauvegardé.
import { create } from 'zustand';

export interface EtatInterface {
  parametresOuverts: boolean;
  ouvrirParametres: () => void;
  fermerParametres: () => void;
}

export const useInterface = create<EtatInterface>()((set) => ({
  parametresOuverts: false,
  ouvrirParametres: () => {
    set({ parametresOuverts: true });
  },
  fermerParametres: () => {
    set({ parametresOuverts: false });
  },
}));
