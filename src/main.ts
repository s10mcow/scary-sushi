import './styles/main.css';

import { createAppShell } from './core/AppShell';
import { Game } from './core/Game';

const shell = createAppShell();
const game = new Game(shell);

game.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy();
  });
}
