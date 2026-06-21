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

    const dx = x - collider.centerX;
    const dz = z - collider.centerZ;
    const rotationY = collider.rotationY ?? 0;
    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    const overlapX = Math.abs(localX) < collider.halfWidth + radius;
    const overlapZ = Math.abs(localZ) < collider.halfDepth + radius;

    return overlapX && overlapZ;
  });
}
