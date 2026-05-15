import { Color, Fog, Scene } from 'three';

import { GAME_CONFIG } from '../config/gameConfig';

export function createScene(): Scene {
  const scene = new Scene();
  scene.background = new Color(GAME_CONFIG.fog.color);
  scene.fog = new Fog(
    GAME_CONFIG.fog.color,
    GAME_CONFIG.fog.near,
    GAME_CONFIG.fog.far,
  );

  return scene;
}
