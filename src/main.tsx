import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/tokens.css';
import './styles/global.css';
import { App } from './App';

const racine = document.getElementById('root');
if (!racine) {
  throw new Error('Élément #root introuvable.');
}

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
