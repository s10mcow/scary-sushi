import {
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from 'three';

import { GAME_CONFIG } from '../config/gameConfig';

export function createDust(): Points {
  const positions = new Float32Array(GAME_CONFIG.dust.count * 3);

  for (let index = 0; index < GAME_CONFIG.dust.count; index += 1) {
    const offset = index * 3;
    positions[offset] = -6 + Math.random() * 18;
    positions[offset + 1] = 0.25 + Math.random() * 3.5;
    positions[offset + 2] = -20 + Math.random() * 36;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  return new Points(
    geometry,
    new PointsMaterial({
      color: 0x8f98a6,
      size: 0.04,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
}
