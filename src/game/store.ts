import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'clair' | 'sombre';

// Étape 1 : seul le thème est persisté. L'étape 5 ajoute la progression (même clé, migration).
export interface ProgressionState {
  theme: Theme;
  definirTheme: (theme: Theme) => void;
}

export const CLE_STOCKAGE = 'branches:v1';

export const useProgression = create<ProgressionState>()(
  persist(
    (set) => ({
      theme: 'clair',
      definirTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: CLE_STOCKAGE,
      version: 1,
      migrate: (persisted) => persisted as ProgressionState,
      partialize: (etat) => ({ theme: etat.theme }),
    },
  ),
);
