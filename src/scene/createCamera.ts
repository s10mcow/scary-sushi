import { PerspectiveCamera } from 'three';

import { GAME_CONFIG } from '../config/gameConfig';

export function createCamera(): PerspectiveCamera {
  return new PerspectiveCamera(
    GAME_CONFIG.camera.fov,
    1,
    GAME_CONFIG.camera.near,
    GAME_CONFIG.camera.far,
  );
}
