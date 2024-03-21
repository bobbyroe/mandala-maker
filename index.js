import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { OBJLoader } from "jsm/loaders/OBJLoader.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 8;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

function initScene(data) {
  const { geos } = data;
  const texLoader = new THREE.TextureLoader();
  const matcap = texLoader.load('./black-n-shiney2.jpg');
  const startHue = Math.random() * 0.5 + 0.5;
  function getInstanced(geometry, index) {
    const numObjs = 8 + index * 4;
    const step = (Math.PI * 2) / numObjs;
    const color = new THREE.Color().setHSL(startHue + index / 10, 1.0, 0.5);
    const material = new THREE.MeshMatcapMaterial({ matcap, color });
    const instaMesh = new THREE.InstancedMesh(geometry, material, numObjs);
    const matrix = new THREE.Matrix4();
    const size = 0.5;
    const radius = 1 + index * 0.6;
    const z = -0.5 + index * -0.25;
    const axis = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < numObjs; i += 1) {
      const x = Math.cos(step * i) * radius;
      const y = Math.sin(step * i) * radius;
      const position = new THREE.Vector3(x, y, z);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(axis, i * step);
      const scale = new THREE.Vector3().setScalar(size);
      matrix.compose(position, quaternion, scale);
      instaMesh.setMatrixAt(i, matrix);
    }
    return instaMesh;
  }

  const box = new THREE.BoxGeometry();
  const ball = new THREE.SphereGeometry(0.66, 16, 16);
  const knot = new THREE.TorusKnotGeometry(0.5, 0.2, 100, 16);
  const cone = new THREE.ConeGeometry(0.5, 1, 4);
  
  const geoms = [box, ball, knot, cone];
  const middles = [ball, knot];
  const randomGeo = middles[Math.floor(Math.random() * middles.length)];
  const numRings = 10;
  for (let i = 0; i < numRings; i += 1) {
    let gIndex = Math.floor(Math.random() * geoms.length);
    const ring = getInstanced(geos[gIndex], i);
    scene.add(ring);
  }
  // add middle piece
  const color = new THREE.Color().setHSL(startHue, 1.0, 0.5);
  const middle = new THREE.Mesh(randomGeo, new THREE.MeshMatcapMaterial({ matcap, color }));
  scene.add(middle);

  function animate(t = 0) {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
  }
  animate();
}

const sceneData = { geos: [] };
const manager = new THREE.LoadingManager();
manager.onLoad = () => initScene(sceneData);
const loader = new OBJLoader(manager);
const objs = [
  'A_12',
  'B_01',
  'B_10',
  'D_08',
  'D_16',
  'H_07',
  'goldfish3',
  'skull2',
];
const path = './objs/';
objs.forEach((objName) => {
  loader.load(`${path}${objName}.obj`, (obj) => {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.geometry.name = objName;
        sceneData.geos.push(child.geometry);
      }
    });
  });
});


function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);
