import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// === FINAL ROBUST ERROR SUPPRESSION ===
const RESIZE_ERROR = 'ResizeObserver loop';

// 1. Suppress standard console errors
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes(RESIZE_ERROR)) {
    return;
  }
  // Sometimes it comes as an Error object
  if (args[0] && args[0].message && args[0].message.includes(RESIZE_ERROR)) {
    return;
  }
  originalError.call(console, ...args);
};

// 2. Suppress unhandled runtime errors that trigger the overlay
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes(RESIZE_ERROR)) {
    event.stopImmediatePropagation();
  }
});

// 3. Suppress unhandled promise rejections (just in case)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes(RESIZE_ERROR)) {
    event.stopImmediatePropagation();
  }
});
// === END SUPPRESSION ===

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);