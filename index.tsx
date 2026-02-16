import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Overlay } from './components/Overlay';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Robust Router: Check if URL contains 'overlay' anywhere
const isOverlay = window.location.pathname.includes('/overlay') || window.location.hash.includes('overlay');

if (isOverlay) {
    // Mount Overlay for vMix Browser Input
    root.render(
        <React.StrictMode>
            <Overlay />
        </React.StrictMode>
    );
} else {
    // Mount Controller for Admin
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}