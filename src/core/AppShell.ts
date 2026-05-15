export interface AppShell {
  root: HTMLElement;
  viewport: HTMLElement;
  overlay: HTMLElement;
}

export function createAppShell(): AppShell {
  const root = document.querySelector<HTMLElement>('#app');
  const viewport = document.querySelector<HTMLElement>('#viewport');
  const overlay = document.querySelector<HTMLElement>('#overlay');

  if (!root || !viewport || !overlay) {
    throw new Error('The app shell is missing required mount points.');
  }

  return { root, viewport, overlay };
}
