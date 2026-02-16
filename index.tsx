import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Overlay } from './components/Overlay';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Robust Router logic
const path = window.location.pathname;
const hash = window.location.hash;

// Determine which view to render based on URL
const isOverlayA = path.includes('/overlay-a') || hash.includes('overlay-a');
const isOverlayB = path.includes('/overlay-b') || hash.includes('overlay-b');
const isFullOverlay = path.includes('/overlay') || hash.includes('overlay');

if (isOverlayA) {
    // Render ONLY Team A elements
    root.render(
        <React.StrictMode>
            <Overlay variant="A" />
        </React.StrictMode>
    );
} else if (isOverlayB) {
    // Render ONLY Team B elements
    root.render(
        <React.StrictMode>
            <Overlay variant="B" />
        </React.StrictMode>
    );
} else if (isFullOverlay) {
    // Render EVERYTHING (Default)
    root.render(
        <React.StrictMode>
            <Overlay variant="full" />
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