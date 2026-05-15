# Static Bloom

Modular first-person horror scaffold built with Vite, TypeScript, and Three.js.

## Scripts

- `npm run dev` starts the Vite dev server.
- `npm run build` runs TypeScript checks and creates a production build.
- `npm run preview` serves the production build locally.

## Structure

- `src/core` wires the app shell, game lifecycle, and frame loop together.
- `src/config` holds gameplay and rendering constants.
- `src/scene` builds the level, lighting, materials, and atmosphere in small scene-focused modules.
- `src/systems` contains movement, input, collision, and flashlight behavior.
- `src/ui` owns the HUD and overlay state.
- `src/types` keeps shared structural types out of the gameplay code.

## Prototype Notes

- Pointer lock is used for the first-person camera.
- `WASD` moves, `Shift` sprints, `F` toggles the flashlight, and `Esc` releases the pointer.
- The current map is a narrow horror corridor with a side room, props, collision, fog, and an exit beacon meant to act as the next encounter hook.
