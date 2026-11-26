import * as THREE from 'three';
import { clone as cloneSkinnedModel } from 'three/addons/utils/SkeletonUtils.js';
import { loadSnowgieModel } from './Snowgie.js';

export function createSnowgiePopulation(scene, groundY, count = 35) {
  loadSnowgieModel()
    .then((gltf) => {
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.sqrt(Math.random()) * 25;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const modelScale = 0.45 + Math.random() * 0.75;

        const model = cloneSkinnedModel(gltf.scene);
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const baseScale = modelScale / (size.y || 1);

        model.scale.setScalar(baseScale);
        model.position.set(
          -center.x * baseScale,
          groundY - bounds.min.y * baseScale,
          -center.z * baseScale,
        );

        const group = new THREE.Group();
        group.position.set(x, 0, z);
        group.rotation.y = Math.random() * Math.PI * 2;
        group.add(model);
        scene.add(group);
      }
    })
    .catch((error) => {
      console.error('Failed to load /models/snowgie.glb:', error);
    });
}
