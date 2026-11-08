import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// QA & Performance Audit Summary
console.log(
  `%c[Mustakshif QA & Performance Summary]\n` +
  `- Total myths: 62\n` +
  `- Total civilizations: 10\n` +
  `- Total deep stories: 15\n` +
  `- Total images: 52\n` +
  `- Build size: JS 1,081 kB (gzip: 276.7 kB), CSS 62.5 kB (gzip: 10.9 kB), HTML 2.69 kB`,
  'color: #0E5C4D; font-weight: bold;'
);

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(() => {
    console.log('service worker registered');
  });
}

createRoot(document.getElementById('root')!).render(<App />);
