import * as THREE from 'three';

export class Footprints {
  constructor(scene, groundY, scale = 1) {
    this.scene = scene;
    this.groundY = groundY;
    this.stepTimer = 0;
    this.nextFootIsLeft = true;
    this.footPosition = new THREE.Vector3();
    this.footprints = [];
    this.lifetime = 3.5;
    this.baseOpacity = 0.55;
    this.stepInterval = 0.12;
    this.geometry = this.createGeometry(scale);
    this.softEdgeTexture = this.createSoftEdgeTexture();
    this.material = new THREE.MeshBasicMaterial({
      color: '#a9c5d8',
      map: this.softEdgeTexture,
      transparent: true,
      opacity: this.baseOpacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }
  

  update(delta, isMoving, group, leftFootOffset, rightFootOffset) {
    this.updateExistingFootprints(delta);

    if (!isMoving) {
      this.stepTimer = 0;
      return;
    }

    this.stepTimer += delta;
    while (this.stepTimer >= this.stepInterval) {
      this.stepTimer -= this.stepInterval;
      this.addFootprint(group, leftFootOffset, rightFootOffset, this.nextFootIsLeft);
      this.nextFootIsLeft = !this.nextFootIsLeft;
    }
  }

  createGeometry(scale) {
    // Maak een ovaal van ongeveer 0.26 breed en 0.32 lang in scene-eenheden.
    const geometry = new THREE.CircleGeometry(1, 16);
    geometry.scale(0.13 * scale, 0.16 * scale, 1);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }

  createSoftEdgeTexture() {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create the footprint edge texture.');
    }

    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.32,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }

  addFootprint(group, leftFootOffset, rightFootOffset, isLeft) {
    const footOffset = isLeft ? leftFootOffset : rightFootOffset;
    if (footOffset) {
      this.footPosition.copy(footOffset);
    } else {
      this.footPosition.set(isLeft ? -0.12 : 0.12, 0, 0);
    }

    this.footPosition.y = 0;
    group.localToWorld(this.footPosition);
    this.footPosition.y = this.groundY + 0.005;
    const direction = group.rotation.y;
    const footprint = new THREE.Mesh(this.geometry, this.material.clone());
    footprint.position.copy(this.footPosition);
    footprint.rotation.y = direction;
    this.scene.add(footprint);
    this.footprints.push({ mesh: footprint, age: 0 });
  }

  updateExistingFootprints(delta) {
    for (let i = this.footprints.length - 1; i >= 0; i--) {
      const footprint = this.footprints[i];
      footprint.age += delta;

      if (footprint.age >= this.lifetime) {
        this.scene.remove(footprint.mesh);
        footprint.mesh.material.dispose();
        this.footprints.splice(i, 1);
      } else {
        const remainingLife = 1 - footprint.age / this.lifetime;
        footprint.mesh.material.opacity = this.baseOpacity * remainingLife;
      }
    }
  }
}
