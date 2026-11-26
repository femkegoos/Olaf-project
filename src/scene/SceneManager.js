import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    const fogColor = new THREE.Color('#dceefa');
    this.scene.background = fogColor;
    this.scene.fog = new THREE.Fog(fogColor, 12, 45);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.set(3, 3, 4);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.y = 0.5;

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 4, 5);
    this.scene.add(light);

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: '#f6f9fc' }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.8;
    this.scene.add(this.ground);

    this.desiredTarget = new THREE.Vector3();
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  follow(targetPosition, delta) {
    if (!targetPosition) {
      return;
    }

    this.desiredTarget.set(targetPosition.x, 0.5, targetPosition.z);
    const followChange = this.desiredTarget
      .sub(this.controls.target)
      .multiplyScalar(1 - Math.exp(-5 * delta));

    this.controls.target.add(followChange);
    this.camera.position.add(followChange);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
