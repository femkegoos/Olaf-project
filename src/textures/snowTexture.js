import * as THREE from 'three';

export function createSnowTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  let seed = 12345;

  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const grain = 247 + (seed % 9);
    data[i] = grain - 1;
    data[i + 1] = grain;
    data[i + 2] = Math.min(grain + 1, 255);
    data[i + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(80, 80);
  texture.needsUpdate = true;
  return texture;
}
