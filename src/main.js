import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { Snowgie } from './snowgie/Snowgie.js';
import { createSnowgiePopulation } from './snowgie/SnowgiePopulation.js';
import './style.css';

const canvas = document.querySelector('#scene');
const sceneManager = new SceneManager(canvas);
const snowgies = [
  new Snowgie(sceneManager.scene, sceneManager.ground.position.y),
  ...createSnowgiePopulation(
    sceneManager.scene,
    sceneManager.ground.position.y,
    sceneManager.camera,
    35,
  ),
];
snowgies.forEach((snowgie) => snowgie.setNeighbors(snowgies));
const clock = new THREE.Clock();
function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  snowgies.forEach((snowgie) => snowgie.update(delta));
  sceneManager.render();
}

sceneManager.renderer.setAnimationLoop(animate);
