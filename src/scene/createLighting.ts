import {
  AmbientLight,
  HemisphereLight,
  Object3D,
  PerspectiveCamera,
  SpotLight,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';

export interface LightingRig {
  ambient: AmbientLight;
  hemisphere: HemisphereLight;
  flashlight: SpotLight;
}

export function createLighting(camera: PerspectiveCamera): LightingRig {
  const ambient = new AmbientLight(0xffffff, 0.62);
  const hemisphere = new HemisphereLight(0xf8fbff, 0xc6bca2, 0.92);

  const flashlight = new SpotLight(
    0xfff1d6,
    GAME_CONFIG.flashlight.intensity,
    GAME_CONFIG.flashlight.distance,
    GAME_CONFIG.flashlight.angle,
    GAME_CONFIG.flashlight.penumbra,
    1.2,
  );
  flashlight.position.set(0, -0.06, 0);
  flashlight.castShadow = false;

  const target = new Object3D();
  target.position.set(0, -0.1, -6);

  camera.add(flashlight, target);
  flashlight.target = target;

  return { ambient, hemisphere, flashlight };
}
