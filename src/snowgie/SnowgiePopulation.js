import * as THREE from 'three';
import { Snowgie } from './Snowgie.js';
import { groundPositionFromScreenPoint } from './Wander.js';

export function createSnowgiePopulation(scene, groundY, camera, count = 35) {
  camera.updateMatrixWorld(true);
  const positions = [new THREE.Vector3()];
  const minimumSpacingSquared = 25;

  return Array.from({ length: count }, () => {
    let position;
    let attempts = 0;
    let isTooClose;

    do {
      position = groundPositionFromScreenPoint(
        camera,
        THREE.MathUtils.randFloatSpread(1.64),
        THREE.MathUtils.randFloatSpread(1.64),
      );
      isTooClose = positions.some(
        (existingPosition) => position.distanceToSquared(existingPosition) < minimumSpacingSquared,
      );
      attempts += 1;
    } while (isTooClose && attempts < 100);

    positions.push(position.clone());
    return new Snowgie(scene, groundY, { position, camera });
  });
}
