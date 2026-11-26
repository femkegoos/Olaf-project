import * as THREE from 'three';
import { Snowgie } from './Snowgie.js';

export function createSnowgiePopulation(scene, groundY, camera, count = 35) {
  const positions = [new THREE.Vector3()];
  const minimumSpacingSquared = 49;
  const screenPosition = new THREE.Vector3();
  camera.updateMatrixWorld(true);

  return Array.from({ length: count }, () => {
    const position = new THREE.Vector3();
    let attempts = 0;
    let isOnScreen;
    let isTooClose;

    do {
      const side = Math.floor(Math.random() * 4);
      const edgePosition = THREE.MathUtils.randFloatSpread(190);
      if (side === 0) {
        position.set(-95, 0, edgePosition);
      } else if (side === 1) {
        position.set(95, 0, edgePosition);
      } else if (side === 2) {
        position.set(edgePosition, 0, -95);
      } else {
        position.set(edgePosition, 0, 95);
      }

      screenPosition.copy(position).project(camera);
      isOnScreen = Math.abs(screenPosition.x) <= 1.1
        && Math.abs(screenPosition.y) <= 1.1;
      isTooClose = positions.some(
        (existingPosition) => position.distanceToSquared(existingPosition) < minimumSpacingSquared,
      );
      attempts += 1;
    } while ((isOnScreen || isTooClose) && attempts < 100);

    if (isOnScreen || isTooClose) {
      throw new Error('Unable to find an off-screen starting position for a snowgie.');
    }

    positions.push(position.clone());
    const initialTarget = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(40),
      0,
      THREE.MathUtils.randFloatSpread(40),
    );
    return new Snowgie(scene, groundY, { position, initialTarget });
  });
}
