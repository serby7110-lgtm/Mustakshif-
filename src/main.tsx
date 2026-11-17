import {createRoot} from 'react-dom/client';
import { initErrorLogger } from './logger';
import './i18n';
import App from './App.tsx';
import './index.css';
import './index.tsx';
import { getAllEntries } from './data/seed';
import { getAllCivilizations } from './data/civTypes';
import { DEEP_STORIES } from './data/storyTypes';

initErrorLogger();

if (import.meta.env?.DEV) {
  console.log(
    `%c[Mustakshif Dev Summary]\n` +
      `- Total myths: ${getAllEntries().length}\n` +
      `- Total civilizations: ${getAllCivilizations().length}\n` +
      `- Total deep stories: ${Object.keys(DEEP_STORIES).length}`,
    'color: #0E5C4D; font-weight: bold;'
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
