import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/400-italic.css'

// Polyfill for crypto.getRandomValues to prevent "getRandomValues is not a function" errors
// in environments that don't support the Web Crypto API fully (e.g. some build tools or older browsers).
if (typeof window !== 'undefined') {
  const win = window as any;
  if (!win.crypto) {
    win.crypto = {};
  }
  if (!win.crypto.getRandomValues) {
    win.crypto.getRandomValues = function(buffer: any) {
      const scale = 256;
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * scale);
      }
      return buffer;
    };
  }
}
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);