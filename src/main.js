import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { Snowgie } from './snowgie/Snowgie.js';
import './style.css';

const canvas = document.querySelector('#scene');
const sceneManager = new SceneManager(canvas);
const snowgie = new Snowgie(sceneManager.scene, sceneManager.ground.position.y);
const clock = new THREE.Clock();
function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const snowgiePosition = snowgie.update(delta);

  sceneManager.follow(snowgiePosition, delta);
  sceneManager.render();
}

sceneManager.renderer.setAnimationLoop(animate);
