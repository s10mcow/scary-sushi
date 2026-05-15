import type { CollisionBox } from '../../types/world';

export function isBlocked(
  x: number,
  z: number,
  colliders: readonly CollisionBox[],
  radius: number,
): boolean {
  return colliders.some((collider) => {
    if (collider.enabled === false) {
      return false;
    }

    const overlapX = Math.abs(x - collider.centerX) < collider.halfWidth + radius;
    const overlapZ = Math.abs(z - collider.centerZ) < collider.halfDepth + radius;

    return overlapX && overlapZ;
  });
}
