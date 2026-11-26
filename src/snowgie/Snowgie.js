import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedModel } from 'three/addons/utils/SkeletonUtils.js';
import { Footprints } from './Footprints.js';
import { createWanderTarget, getWanderRestBreakDuration } from './Wander.js';

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
  constructor(scene, groundY, options = {}) {
    this.scene = scene;
    this.groundY = groundY;
    this.startPosition = options.position
      ? options.position.clone()
      : new THREE.Vector3();
    this.initialTarget = options.initialTarget
      ? options.initialTarget.clone()
      : null;
    this.camera = options.camera || null;
    this.modelHeight = options.height || 1.5;
    this.footprints = new Footprints(scene, groundY, this.modelHeight / 1.5);
    this.group = null;
    this.mixer = null;
    this.leftFoot = null;
    this.rightFoot = null;
    this.pelvis = null;
    this.pelvisRestPosition = null;
    this.leftFootRestPosition = null;
    this.rightFootRestPosition = null;
    this.leftFootOffset = null;
    this.rightFootOffset = null;
    this.leftFootRestRotation = 0;
    this.rightFootRestRotation = 0;
    this.isResting = false;
    this.sitsDuringRest = false;
    this.sitProgress = 0;
    this.movementTime = 0;
    this.movementSpeed = 4;
    this.currentSpeed = 0;
    this.restTimeRemaining = 0;
    this.moveDirection = new THREE.Vector3();
    this.separationDirection = new THREE.Vector3();
    this.neighborOffset = new THREE.Vector3();
    this.neighbors = [];
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
    const scale = this.modelHeight / (size.y || 1);

    model.scale.setScalar(scale);
    model.position.set(
      -center.x * scale,
      this.groundY - bounds.min.y * scale,
      -center.z * scale,
    );

    this.group = new THREE.Group();
    this.group.position.copy(this.startPosition);
    this.group.add(model);
    this.scene.add(this.group);
    this.chooseWanderTarget();

    this.pelvis = model.getObjectByName('bone_pelvis_00');
    this.leftFoot = model.getObjectByName('bone_L_foot_03');
    this.rightFoot = model.getObjectByName('bone_R_foot_02');
    this.pelvisRestPosition = this.pelvis ? this.pelvis.position.clone() : null;
    this.leftFootRestPosition = this.leftFoot ? this.leftFoot.position.clone() : null;
    this.rightFootRestPosition = this.rightFoot ? this.rightFoot.position.clone() : null;
    this.leftFootOffset = this.getFootOffset(this.leftFoot);
    this.rightFootOffset = this.getFootOffset(this.rightFoot);
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

  getFootOffset(foot) {
    if (!foot) {
      return null;
    }

    this.group.updateMatrixWorld(true);
    return this.group.worldToLocal(foot.getWorldPosition(new THREE.Vector3()));
  }

  chooseWanderTarget() {
    if (this.initialTarget) {
      this.wanderTarget.copy(this.initialTarget);
      this.initialTarget = null;
      return;
    }

    let attempts = 0;
    do {
      this.wanderTarget.copy(createWanderTarget(this.camera));
      attempts += 1;
    } while (
      this.group
      && this.group.position.distanceToSquared(this.wanderTarget) < 64
      && attempts < 10
    );

    if (this.group && this.group.position.distanceToSquared(this.wanderTarget) < 64) {
      this.wanderTarget.copy(createWanderTarget(null));
    }
  }

  setNeighbors(snowgies) {
    this.neighbors = snowgies.filter((snowgie) => snowgie !== this);
  }

  update(delta) {
    if (!this.group) {
      return null;
    }

    if (this.isResting) {
      this.restTimeRemaining = Math.max(0, this.restTimeRemaining - delta);
      if (this.restTimeRemaining > 0 || this.sitProgress > 0.02) {
        return this.updateResting(delta);
      }

      this.isResting = false;
      this.sitsDuringRest = false;
      this.sitProgress = 0;
      this.applySittingPose();
      this.chooseWanderTarget();
    }

    this.moveDirection.subVectors(this.wanderTarget, this.group.position);
    let distanceToTarget = this.moveDirection.length();
    if (distanceToTarget < 2.5) {
      this.restTimeRemaining = getWanderRestBreakDuration();
      if (this.restTimeRemaining > 0) {
        this.isResting = true;
        this.sitsDuringRest = Math.random() < 0.5;
        return this.updateResting(delta);
      }

      this.chooseWanderTarget();
      this.moveDirection.subVectors(this.wanderTarget, this.group.position);
      distanceToTarget = this.moveDirection.length();
    }

    this.moveDirection.normalize();
    this.separationDirection.set(0, 0, 0);
    const separationRadius = 6;
    for (const neighbor of this.neighbors) {
      if (!neighbor.group) {
        continue;
      }

      const distance = this.group.position.distanceTo(neighbor.group.position);
      if (distance > 0 && distance < separationRadius) {
        this.neighborOffset
          .subVectors(this.group.position, neighbor.group.position)
          .normalize();
        this.separationDirection.addScaledVector(
          this.neighborOffset,
          1 - distance / separationRadius,
        );
      }
    }

    if (this.separationDirection.lengthSq() > 0) {
      this.moveDirection
        .addScaledVector(this.separationDirection, 2.5)
        .normalize();
    }

    const targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
    const rotationDelta = Math.atan2(
      Math.sin(targetRotation - this.group.rotation.y),
      Math.cos(targetRotation - this.group.rotation.y),
    );
    this.group.rotation.y += rotationDelta * (1 - Math.exp(-5 * delta));
    this.moveDirection.set(
      Math.sin(this.group.rotation.y),
      0,
      Math.cos(this.group.rotation.y),
    );
    const targetSpeed = this.movementSpeed * (
      0.45 + 0.55 * THREE.MathUtils.smoothstep(distanceToTarget, 2.5, 6)
    );
    this.currentSpeed = THREE.MathUtils.damp(
      this.currentSpeed,
      targetSpeed,
      4,
      delta,
    );
    const isMoving = this.currentSpeed > 0.35;
    this.footprints.update(
      delta,
      isMoving,
      this.group,
      this.leftFootOffset,
      this.rightFootOffset,
    );
    this.group.position.addScaledVector(
      this.moveDirection,
      Math.min(this.currentSpeed * delta, distanceToTarget),
    );
    this.movementTime += delta;

    this.animateFeet(isMoving, delta);
    if (this.mixer) {
      this.mixer.update(delta);
    }

    return this.group.position;
  }

  updateResting(delta) {
    this.currentSpeed = 0;
    this.sitProgress = THREE.MathUtils.damp(
      this.sitProgress,
      this.sitsDuringRest && this.restTimeRemaining > 0 ? 1 : 0,
      2,
      delta,
    );
    this.applySittingPose();
    this.footprints.update(
      delta,
      false,
      this.group,
      this.leftFootOffset,
      this.rightFootOffset,
    );
    this.animateFeet(false, delta);
    if (this.mixer) {
      this.mixer.update(delta);
    }

    return this.group.position;
  }

  applySittingPose() {
    const sitDepth = 0.45 * this.sitProgress;
    const footForwardOffset = 0.35 * this.sitProgress;
    if (this.pelvis && this.pelvisRestPosition) {
      this.pelvis.position.y = this.pelvisRestPosition.y - sitDepth;
    }

    this.group.updateMatrixWorld(true);
    for (const [foot, restPosition] of [
      [this.leftFoot, this.leftFootRestPosition],
      [this.rightFoot, this.rightFootRestPosition],
    ]) {
      if (!foot || !restPosition || !foot.parent) {
        continue;
      }

      const localOffset = new THREE.Vector3(0, sitDepth, 0)
        .applyQuaternion(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert())
        .divide(foot.parent.getWorldScale(new THREE.Vector3()));
      foot.position.copy(restPosition).add(localOffset);
      foot.position.y = restPosition.y + footForwardOffset;
    }
  }

  animateFeet(isMoving, delta) {
    const footSwing = Math.sin(this.movementTime * 10) * 0.55;
    const sittingFootRotation = -0.9 * this.sitProgress;

    if (this.leftFoot) {
      let targetRotation = this.leftFootRestRotation;
      if (isMoving) {
        targetRotation = this.leftFootRestRotation + footSwing;
      }
      targetRotation += sittingFootRotation;

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
      targetRotation += sittingFootRotation;

      this.rightFoot.rotation.x = THREE.MathUtils.damp(
        this.rightFoot.rotation.x,
        targetRotation,
        12,
        delta,
      );
    }
  }
}
