import * as THREE from 'three';
import { createSnowTexture } from '../textures/snowTexture.js';

export class SceneManager {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    const fogColor = new THREE.Color('#dceefa');
    this.scene.background = fogColor;
    this.scene.fog = new THREE.Fog(fogColor, 100, 200);

    this.cameraViewSize = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const viewHeight = this.cameraViewSize * Math.max(1, 1 / aspect);
    const viewWidth = viewHeight * aspect;
    this.camera = new THREE.OrthographicCamera(
      -viewWidth / 2,
      viewWidth / 2,
      viewHeight / 2,
      -viewHeight / 2,
      0.1,
      200,
    );
    this.camera.position.set(0, 38, 55);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 4, 5);
    this.scene.add(light);

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: '#f2f8ff',
        map: createSnowTexture(),
        roughness: 0.95,
      }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.8;
    this.scene.add(this.ground);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewHeight = this.cameraViewSize * Math.max(1, 1 / aspect);
    const viewWidth = viewHeight * aspect;
    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
