import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedModel } from 'three/addons/utils/SkeletonUtils.js';
import { Footprints } from './Footprints.js';

let snowgieModelPromise = null;

export function loadSnowgieModel() {
  if (!snowgieModelPromise) {
    snowgieModelPromise = new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        '/models/snowgie.glb',
        resolve,
        undefined,
        reject,
      );
    });
  }

  return snowgieModelPromise;
}

export class Snowgie {
  constructor(scene, groundY) {
    this.scene = scene;
    this.groundY = groundY;
    this.footprints = new Footprints(scene, groundY);
    this.group = null;
    this.mixer = null;
    this.leftFoot = null;
    this.rightFoot = null;
    this.leftFootRestRotation = 0;
    this.rightFootRestRotation = 0;
    this.movementTime = 0;
    this.movementSpeed = 4;
    this.moveDirection = new THREE.Vector3();
    this.wanderTarget = new THREE.Vector3();

    this.loadModel();
  }

  get position() {
    if (this.group) {
      return this.group.position;
    }

    return null;
  }

  loadModel() {
    loadSnowgieModel()
      .then((gltf) => this.addModel(gltf))
      .catch((error) => {
        console.error('Failed to load /models/snowgie.glb:', error);
      });
  }

  addModel(gltf) {
    const model = cloneSkinnedModel(gltf.scene);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 1.5 / (size.y || 1);

    model.scale.setScalar(scale);
    model.position.set(
      -center.x * scale,
      this.groundY - bounds.min.y * scale,
      -center.z * scale,
    );

    this.group = new THREE.Group();
    this.group.add(model);
    this.scene.add(this.group);

    this.leftFoot = model.getObjectByName('bone_L_foot_03');
    this.rightFoot = model.getObjectByName('bone_R_foot_02');
    if (this.leftFoot) {
      this.leftFootRestRotation = this.leftFoot.rotation.x;
    } else {
      this.leftFootRestRotation = 0;
    }

    if (this.rightFoot) {
      this.rightFootRestRotation = this.rightFoot.rotation.x;
    } else {
      this.rightFootRestRotation = 0;
    }

    if (gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => this.mixer.clipAction(clip).play());
    }
  }

  chooseWanderTarget() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * 25;
    this.wanderTarget.set(
      Math.cos(angle) * distance,
      0,
      Math.sin(angle) * distance,
    );
  }

  update(delta) {
    if (!this.group) {
      return null;
    }

    this.moveDirection.subVectors(this.wanderTarget, this.group.position);
    let distanceToTarget = this.moveDirection.length();
    if (distanceToTarget < 0.5) {
      this.chooseWanderTarget();
      this.moveDirection.subVectors(this.wanderTarget, this.group.position);
      distanceToTarget = this.moveDirection.length();
    }

    this.moveDirection.normalize();
    this.group.position.addScaledVector(
      this.moveDirection,
      Math.min(this.movementSpeed * delta, distanceToTarget),
    );
    this.group.rotation.y = Math.atan2(this.moveDirection.x, this.moveDirection.z);
    this.movementTime += delta;

    this.animateFeet(true, delta);
    if (this.mixer) {
      this.mixer.update(delta);
    }

    this.footprints.update(delta, true, this.group, this.leftFoot, this.rightFoot);

    return this.group.position;
  }

  animateFeet(isMoving, delta) {
    const footSwing = Math.sin(this.movementTime * 10) * 0.55;

    if (this.leftFoot) {
      let targetRotation = this.leftFootRestRotation;
      if (isMoving) {
        targetRotation = this.leftFootRestRotation + footSwing;
      }

      this.leftFoot.rotation.x = THREE.MathUtils.damp(
        this.leftFoot.rotation.x,
        targetRotation,
        12,
        delta,
      );
    }

    if (this.rightFoot) {
      let targetRotation = this.rightFootRestRotation;
      if (isMoving) {
        targetRotation = this.rightFootRestRotation - footSwing;
      }

      this.rightFoot.rotation.x = THREE.MathUtils.damp(
        this.rightFoot.rotation.x,
        targetRotation,
        12,
        delta,
      );
    }
  }
}
