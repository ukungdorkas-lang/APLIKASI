import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalParse = JSON.parse;
JSON.parse = function(text, reviver) {
  if (text === "undefined") return undefined;
  try {
    return originalParse(text, reviver);
  } catch (e) {
    console.error("JSON.parse failed on:", text);
    throw e;
  }
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
