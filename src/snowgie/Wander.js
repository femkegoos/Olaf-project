import * as THREE from 'three';

export function groundPositionFromScreenPoint(camera, ndcX, ndcY) {
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const screenX = ndcX * (camera.right - camera.left) / 2;
  const screenY = ndcY * (camera.top - camera.bottom) / 2;
  const determinant = right.x * up.z - right.z * up.x;

  return new THREE.Vector3(
    (screenX * up.z - right.z * screenY) / determinant,
    0,
    (right.x * screenY - screenX * up.x) / determinant,
  );
}

export function createWanderTarget(camera) {
  if (camera && Math.random() < 0.8) {
    return groundPositionFromScreenPoint(
      camera,
      THREE.MathUtils.randFloatSpread(1.8),
      THREE.MathUtils.randFloatSpread(1.8),
    );
  }

  return new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(180),
    0,
    THREE.MathUtils.randFloatSpread(180),
  );
}

export function getWanderRestBreakDuration(minSeconds = 2, maxSeconds = 8) {
  if (Math.random() >= 0.2) return 0;
  return THREE.MathUtils.randFloat(minSeconds, maxSeconds);
}
