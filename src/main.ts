import './styles/main.css';

import { createAppShell } from './core/AppShell';
import { Game } from './core/Game';

const shell = createAppShell();
const game = new Game(shell);

game.start();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is a bonus; the game still runs if the browser blocks service workers.
    });
  });
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy();
  });
}
