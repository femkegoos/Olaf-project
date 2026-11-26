import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Snowgie {
  constructor(scene, groundY) {
    this.scene = scene;
    this.groundY = groundY;
    this.group = null;
    this.mixer = null;
    this.leftFoot = null;
    this.rightFoot = null;
    this.leftFootRestRotation = 0;
    this.rightFootRestRotation = 0;
    this.movementTime = 0;
    this.keysPressed = new Set();
    this.movementKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    this.movementSpeed = 2.5;
    this.moveDirection = new THREE.Vector3();

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.clearKeys = this.clearKeys.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clearKeys);

    this.loadModel();
  }

  get position() {
    return this.group ? this.group.position : null;
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/models/snowgie.glb',
      (gltf) => this.addModel(gltf),
      undefined,
      (error) => {
        console.error('Failed to load /models/snowgie.glb:', error);
      },
    );
  }

  addModel(gltf) {
    const model = gltf.scene;
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
    this.leftFootRestRotation = this.leftFoot?.rotation.x ?? 0;
    this.rightFootRestRotation = this.rightFoot?.rotation.x ?? 0;

    if (gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => this.mixer.clipAction(clip).play());
    }
  }

  handleKeyDown(event) {
    if (this.movementKeys.has(event.key)) {
      event.preventDefault();
      this.keysPressed.add(event.key);
    }
  }

  handleKeyUp(event) {
    this.keysPressed.delete(event.key);
  }

  clearKeys() {
    this.keysPressed.clear();
  }

  update(delta) {
    if (!this.group) {
      return null;
    }

    this.moveDirection.set(
      Number(this.keysPressed.has('ArrowRight')) - Number(this.keysPressed.has('ArrowLeft')),
      0,
      Number(this.keysPressed.has('ArrowDown')) - Number(this.keysPressed.has('ArrowUp')),
    );

    const isMoving = this.moveDirection.lengthSq() > 0;
    if (isMoving) {
      this.moveDirection.normalize();
      this.group.position.addScaledVector(this.moveDirection, this.movementSpeed * delta);
      this.group.rotation.y = Math.atan2(this.moveDirection.x, this.moveDirection.z);
      this.movementTime += delta;
    }

    this.animateFeet(isMoving, delta);
    this.mixer?.update(delta);
    return this.group.position;
  }

  animateFeet(isMoving, delta) {
    const footSwing = Math.sin(this.movementTime * 10) * 0.55;

    if (this.leftFoot) {
      const targetRotation = isMoving
        ? this.leftFootRestRotation + footSwing
        : this.leftFootRestRotation;
      this.leftFoot.rotation.x = THREE.MathUtils.damp(
        this.leftFoot.rotation.x,
        targetRotation,
        12,
        delta,
      );
    }

    if (this.rightFoot) {
      const targetRotation = isMoving
        ? this.rightFootRestRotation - footSwing
        : this.rightFootRestRotation;
      this.rightFoot.rotation.x = THREE.MathUtils.damp(
        this.rightFoot.rotation.x,
        targetRotation,
        12,
        delta,
      );
    }
  }
}
