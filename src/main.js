import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const fogColor = new THREE.Color('#dce8f0');
scene.background = fogColor;
scene.fog = new THREE.Fog(fogColor, 12, 45);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(3, 2.5, 4);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(3, 4, 5);
scene.add(light);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: '#f6f9fc' }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.8;
scene.add(ground);

const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const material = new THREE.MeshStandardMaterial({ color: '#39e75f' });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);

function animate() {
  cube.rotation.x += 0.005;
  cube.rotation.y += 0.008;
  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
