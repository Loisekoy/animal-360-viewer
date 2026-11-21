import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import './style.css';

const animals = {
  fox: {
    name: '赤狐', english: 'Red fox', habitat: '森林', icon: '🦊',
    model: '/assets/fox-realistic.glb', background: '/assets/forest-stage.png',
    span: 4.45, grounded: true, rotationY: -0.5,
  },
  butterfly: {
    name: '蝴蝶', english: 'Blue morpho butterfly', habitat: '濕地', icon: '🦋',
    model: '/assets/butterfly-realistic.glb', background: '/assets/wetland-stage.png',
    span: 3.7, grounded: false, rotationY: 0.25, floatY: 1.65,
  },
  penguin: {
    name: '企鵝', english: 'Penguin', habitat: '極地', icon: '🐧',
    model: '/assets/penguin-realistic.glb', background: '/assets/polar-stage.png',
    span: 3.75, grounded: true, rotationY: -0.2,
  },
  whale: {
    name: '鯨魚', english: 'Humpback whale', habitat: '海洋', icon: '🐋',
    model: '/assets/whale-realistic.glb', background: '/assets/ocean-stage.png',
    span: 5.55, grounded: false, rotationY: Math.PI / 2.2, floatY: 1.7,
    camera: [6.6, 3.4, 9.2], target: [0, 1.55, 0],
  },
  bat: {
    name: '蝙蝠', english: 'Bat', habitat: '洞穴', icon: '🦇',
    model: '/assets/bat-animated.glb', background: '/assets/forest-stage.png',
    span: 4.15, grounded: false, rotationY: 0.1, floatY: 1.75,
    animation: /fly/i, stripPositionTracks: true,
  },
  lion: {
    name: '獅子', english: 'African lion', habitat: '草原', icon: '🦁',
    model: '/assets/lion-realistic.glb', background: '/assets/savanna-stage.png',
    span: 4.65, grounded: true, rotationY: -0.55,
  },
  rhino: {
    name: '犀牛', english: 'White rhinoceros', habitat: '草原', icon: '🦏',
    model: '/assets/rhino-realistic.glb', background: '/assets/savanna-stage.png',
    span: 4.75, grounded: true, rotationY: -0.55,
  },
  snail: {
    name: '蝸牛', english: 'Garden snail', habitat: '濕地', icon: '🐌',
    procedural: 'snail', background: '/assets/wetland-stage.png',
    span: 3.5, grounded: true, rotationY: -0.45,
  },
  frog: {
    name: '青蛙', english: 'Poison dart frog', habitat: '池塘', icon: '🐸',
    model: '/assets/frog-realistic.glb', background: '/assets/wetland-stage.png',
    span: 3.25, grounded: true, rotationY: -0.35, forceOpaque: true,
  },
  bird: {
    name: '鳥', english: 'European robin', habitat: '森林', icon: '🐦',
    model: '/assets/bird-realistic.glb', background: '/assets/forest-stage.png',
    span: 3.35, grounded: true, rotationY: -0.25,
  },
};

const $ = (selector) => document.querySelector(selector);
const canvas = $('#scene');
const viewer = $('#viewer');
const experience = $('.experience');
const loading = $('.model-loading');
const loadingLabel = $('#loading-label');
const modelError = $('.model-error');
const retryModelButton = $('#retry-model');
const autoRotateButton = $('#auto-rotate');
const resetButton = $('#reset-view');
const openPickerButton = $('#open-animal-picker');
const closePickerButton = $('#close-animal-picker');
const animalPicker = $('#animal-picker');
const animalGrid = $('#animal-grid');
const openGuideButton = $('#open-guide');
const closeGuideButton = $('#close-guide');
const guidePanel = $('#guide-panel');
const panelScrim = $('#panel-scrim');
const guideContent = $('#guide-content');
const guideForm = $('#guide-form');
const questionInput = $('#guide-question');
const submitButton = guideForm.querySelector('button[type="submit"]');
const guideMessage = $('.guide-message');
const guideAnswer = $('.guide-answer');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07131c, 0.045);

const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
const fallbackCamera = [5.7, 3.1, 7.8];
const fallbackTarget = [0, 1.35, 0];

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 4.6;
controls.maxDistance = 12.5;
controls.minPolarAngle = Math.PI * 0.2;
controls.maxPolarAngle = Math.PI * 0.58;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.65;
controls.zoomSpeed = 0.72;
controls.rotateSpeed = 0.58;

scene.add(new THREE.HemisphereLight(0xc4ddeb, 0x1a160f, 2.35));

const keyLight = new THREE.DirectionalLight(0xffd5ad, 5.25);
keyLight.position.set(-4.2, 7.5, 5.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 18;
keyLight.shadow.camera.left = -4;
keyLight.shadow.camera.right = 4;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -2;
keyLight.shadow.bias = -0.00015;
scene.add(keyLight);

const warmRim = new THREE.DirectionalLight(0xff873e, 3.1);
warmRim.position.set(4, 4.5, -5);
scene.add(warmRim);

const coolFill = new THREE.PointLight(0x83bcd5, 2.3, 14);
coolFill.position.set(-4.5, 2.8, -2.8);
scene.add(coolFill);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(2.65, 64),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.38 }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.scale.y = 0.46;
shadow.position.y = 0.015;
shadow.receiveShadow = true;
scene.add(shadow);

const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xe7e1d3, transparent: true, opacity: 0.3 });
const orbitPoints = Array.from({ length: 97 }, (_, index) => {
  const angle = (index / 96) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * 2.9, 0.035, Math.sin(angle) * 0.96);
});
const orbitRing = new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPoints), orbitMaterial);
scene.add(orbitRing);

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const ktx2Loader = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer);
loader.setKTX2Loader(ktx2Loader);

let currentAnimalId = 'fox';
let currentModel = null;
let mixer = null;
let loadSequence = 0;
let guideLoadedFor = '';
let guideLoading = false;

function getAnimal() {
  return animals[currentAnimalId];
}

function setAutoRotate(enabled) {
  controls.autoRotate = enabled;
  autoRotateButton.setAttribute('aria-checked', String(enabled));
  autoRotateButton.classList.toggle('is-off', !enabled);
}

function resetView() {
  const config = getAnimal();
  camera.position.fromArray(config.camera || fallbackCamera);
  controls.target.fromArray(config.target || fallbackTarget);
  controls.update();
  setAutoRotate(true);
  resetButton.classList.remove('is-resetting');
  requestAnimationFrame(() => resetButton.classList.add('is-resetting'));
}

function disposeModel(model) {
  if (!model) return;
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose();
      }
      material.dispose();
    }
  });
}

function prepareModel(model, config) {
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.envMapIntensity = 0.58;
      if (typeof material.metalness === 'number') material.metalness = Math.min(material.metalness, 0.12);
      if (config.forceOpaque) {
        material.opacity = 1;
        material.transparent = false;
        material.depthWrite = true;
      }
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.anisotropy = maxAnisotropy;
      }
      material.needsUpdate = true;
    }
  });
}

function placeModel(model, config) {
  const initialBox = new THREE.Box3().setFromObject(model);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  const largestSide = Math.max(initialSize.x, initialSize.y, initialSize.z);
  model.scale.setScalar(config.span / Math.max(largestSide, 0.001));

  model.rotation.y = config.rotationY || 0;
  const fittedBox = new THREE.Box3().setFromObject(model);
  const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
  model.position.x -= fittedCenter.x;
  model.position.z -= fittedCenter.z;
  if (config.grounded) {
    model.position.y -= fittedBox.min.y - 0.04;
  } else {
    model.position.y += (config.floatY || 1.6) - fittedCenter.y;
  }
}

function cylinderBetween(start, end, radius, material, radialSegments = 18) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.08, direction.length(), radialSegments),
    material,
  );
  cylinder.position.copy(start).add(end).multiplyScalar(0.5);
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return cylinder;
}

function createProceduralSnail() {
  const snail = new THREE.Group();
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0x817567,
    roughness: 0.58,
    clearcoat: 0.28,
    clearcoatRoughness: 0.4,
  });
  const skinDark = new THREE.MeshStandardMaterial({ color: 0x4b4138, roughness: 0.68 });
  const shell = new THREE.MeshPhysicalMaterial({
    color: 0x8a4f2b,
    roughness: 0.5,
    clearcoat: 0.32,
    clearcoatRoughness: 0.35,
  });
  const shellBand = new THREE.MeshStandardMaterial({ color: 0x3e2418, roughness: 0.56 });
  const eye = new THREE.MeshPhysicalMaterial({ color: 0x070605, roughness: 0.18, clearcoat: 0.9 });

  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 1.7, 12, 32), skin);
  foot.rotation.z = Math.PI / 2;
  foot.scale.set(1, 0.7, 0.92);
  foot.position.set(0, 0.28, 0);
  snail.add(foot);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 48, 32), skin);
  head.scale.set(1.08, 0.9, 0.92);
  head.position.set(-0.96, 0.5, 0);
  snail.add(head);

  const shellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.88, 64, 40), shell);
  shellMesh.scale.set(1, 1.02, 0.43);
  shellMesh.position.set(0.24, 0.94, 0);
  snail.add(shellMesh);

  for (const side of [-1, 1]) {
    const z = side * 0.39;
    const points = [];
    for (let index = 0; index <= 48; index += 1) {
      const progress = index / 48;
      const angle = progress * Math.PI * 4.2;
      const radius = 0.055 + progress * 0.61;
      points.push(new THREE.Vector3(
        0.24 + Math.cos(angle) * radius,
        0.94 + Math.sin(angle) * radius,
        z * (1 - progress * 0.3),
      ));
    }
    const spiral = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.026, 10, false),
      shellBand,
    );
    snail.add(spiral);
  }

  for (const side of [-1, 1]) {
    const upperStart = new THREE.Vector3(-1.08, 0.72, side * 0.18);
    const upperEnd = new THREE.Vector3(-1.42, 1.32, side * 0.27);
    snail.add(cylinderBetween(upperStart, upperEnd, 0.032, skinDark));
    const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), eye);
    eyeMesh.position.copy(upperEnd);
    snail.add(eyeMesh);

    const lowerStart = new THREE.Vector3(-1.12, 0.55, side * 0.19);
    const lowerEnd = new THREE.Vector3(-1.42, 0.78, side * 0.31);
    snail.add(cylinderBetween(lowerStart, lowerEnd, 0.022, skinDark));
  }

  return snail;
}

function updateDocumentForAnimal() {
  const config = getAnimal();
  $('#page-title').textContent = `與${config.name}面對面`;
  $('#guide-title').textContent = `${config.name}小百科`;
  $('#guide-question-label').textContent = `詢問${config.name}相關問題`;
  viewer.setAttribute('aria-label', `${config.name} 3D 互動展示區`);
  canvas.setAttribute('aria-label', `可拖曳旋轉、縮放的${config.name} 3D 模型`);
  loadingLabel.textContent = `正在載入${config.name}模型…`;
  experience.style.setProperty('--stage-image', `url('${config.background}')`);
  document.title = `WILD 360｜${config.name} 3D 互動展示`;
  document.querySelector('meta[name="description"]').content = `可自由旋轉、縮放並由 OpenAI 導覽的${config.name} 360 度 3D 展示。`;
  shadow.visible = config.grounded;
  orbitRing.visible = config.grounded;

  for (const button of animalGrid.querySelectorAll('.animal-card')) {
    const selected = button.dataset.animal === currentAnimalId;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
}

async function loadAnimal(animalId = currentAnimalId) {
  if (!animals[animalId]) return;
  currentAnimalId = animalId;
  const config = getAnimal();
  const sequence = ++loadSequence;
  updateDocumentForAnimal();
  resetGuide();
  resetView();
  viewer.classList.remove('is-ready');
  loading.hidden = false;
  modelError.hidden = true;

  if (mixer) {
    mixer.stopAllAction();
    mixer = null;
  }
  if (currentModel) {
    scene.remove(currentModel);
    disposeModel(currentModel);
    currentModel = null;
  }

  try {
    const gltf = config.procedural === 'snail'
      ? { scene: createProceduralSnail(), animations: [] }
      : await loader.loadAsync(config.model);
    if (sequence !== loadSequence) {
      disposeModel(gltf.scene);
      return;
    }

    currentModel = gltf.scene;
    currentModel.name = `${config.english} — WILD 360`;
    prepareModel(currentModel, config);
    placeModel(currentModel, config);
    scene.add(currentModel);

    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(currentModel);
      const preferred = config.animation
        ? gltf.animations.find((clip) => config.animation.test(clip.name))
        : null;
      let clip = preferred || gltf.animations[0];
      if (config.stripPositionTracks) {
        clip = new THREE.AnimationClip(
          `${clip.name}-in-place`,
          clip.duration,
          clip.tracks.filter((track) => !track.name.endsWith('.position')),
        );
      }
      mixer.clipAction(clip).setEffectiveTimeScale(0.72).play();
    }

    loading.hidden = true;
    viewer.classList.add('is-ready');
  } catch (error) {
    if (sequence !== loadSequence) return;
    console.error(`${config.english} model failed to load:`, error?.message || error?.name || 'UnknownError');
    loading.hidden = true;
    modelError.hidden = false;
  }
}

function buildAnimalGrid() {
  animalGrid.replaceChildren(...Object.entries(animals).map(([id, animal], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'animal-card';
    button.dataset.animal = id;
    button.setAttribute('aria-pressed', String(id === currentAnimalId));
    button.innerHTML = `
      <span class="animal-card__number">${String(index + 1).padStart(2, '0')}</span>
      <span class="animal-card__icon" aria-hidden="true">${animal.icon}</span>
      <span class="animal-card__copy"><strong>${animal.name}</strong><small>${animal.habitat}</small></span>
      <span class="animal-card__check" aria-hidden="true">✓</span>
    `;
    button.addEventListener('click', () => {
      closePicker(false);
      const params = new URLSearchParams(window.location.search);
      params.set('animal', id);
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
      loadAnimal(id);
      canvas.focus({ preventScroll: true });
    });
    return button;
  }));
}

function openPicker() {
  closeGuide(false);
  document.body.classList.add('picker-open');
  animalPicker.setAttribute('aria-hidden', 'false');
  openPickerButton.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => closePickerButton.focus({ preventScroll: true }), 380);
}

function closePicker(restoreFocus = true) {
  document.body.classList.remove('picker-open');
  animalPicker.setAttribute('aria-hidden', 'true');
  openPickerButton.setAttribute('aria-expanded', 'false');
  experience.scrollTop = 0;
  if (restoreFocus) openPickerButton.focus({ preventScroll: true });
}

function setGuideLoading(loadingState) {
  guideLoading = loadingState;
  guideContent.classList.toggle('is-loading', loadingState);
  submitButton.disabled = loadingState;
  questionInput.disabled = loadingState;
  submitButton.textContent = loadingState ? '思考中' : '提問';
}

function showGuideMessage(message, type = 'info') {
  guideMessage.hidden = false;
  guideMessage.dataset.type = type;
  guideMessage.textContent = message;
  guideContent.classList.add('has-message');
}

function hideGuideMessage() {
  guideMessage.hidden = true;
  guideMessage.textContent = '';
  delete guideMessage.dataset.type;
  guideContent.classList.remove('has-message');
}

function resetGuide() {
  guideLoadedFor = '';
  hideGuideMessage();
  guideAnswer.hidden = true;
  questionInput.value = '';
  for (const field of guideContent.querySelectorAll('[data-field]')) field.textContent = '';
}

function renderGuide(data, isQuestion = false) {
  for (const field of ['habitat', 'behavior', 'fact']) {
    guideContent.querySelector(`[data-field="${field}"]`).textContent = data[field] || '';
  }
  if (data.answer) {
    guideAnswer.hidden = false;
    guideContent.querySelector('[data-field="answer"]').textContent = data.answer;
    if (isQuestion) guideAnswer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function requestGuide(question = '') {
  if (guideLoading) return;
  const requestedAnimalId = currentAnimalId;
  setGuideLoading(true);
  hideGuideMessage();

  try {
    const response = await fetch('/api/animal-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animalId: requestedAnimalId, question }),
    });
    const data = await response.json().catch(() => ({}));
    if (requestedAnimalId !== currentAnimalId) return;

    if (!response.ok) {
      if (data.code === 'OPENAI_API_KEY_MISSING') {
        showGuideMessage('AI 導覽介面已準備好。請先在 .env.local 設定 OPENAI_API_KEY，再重新啟動網站。', 'setup');
      } else {
        showGuideMessage(data.message || '導覽員暫時無法回應，請稍後再試。', 'error');
      }
      return;
    }

    renderGuide(data, Boolean(question));
    guideLoadedFor = requestedAnimalId;
  } catch {
    showGuideMessage('目前無法連上 AI 導覽服務，請確認網站伺服器正在運作。', 'error');
  } finally {
    setGuideLoading(false);
  }
}

function openGuide() {
  closePicker(false);
  document.body.classList.add('guide-open');
  guidePanel.setAttribute('aria-hidden', 'false');
  openGuideButton.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => closeGuideButton.focus({ preventScroll: true }), 380);
  if (guideLoadedFor !== currentAnimalId) requestGuide();
}

function closeGuide(restoreFocus = true) {
  document.body.classList.remove('guide-open');
  guidePanel.setAttribute('aria-hidden', 'true');
  openGuideButton.setAttribute('aria-expanded', 'false');
  experience.scrollTop = 0;
  if (restoreFocus) openGuideButton.focus({ preventScroll: true });
}

autoRotateButton.addEventListener('click', () => setAutoRotate(!controls.autoRotate));
resetButton.addEventListener('click', resetView);
retryModelButton.addEventListener('click', () => loadAnimal());
canvas.addEventListener('dblclick', resetView);
openPickerButton.addEventListener('click', openPicker);
closePickerButton.addEventListener('click', () => closePicker());
openGuideButton.addEventListener('click', openGuide);
closeGuideButton.addEventListener('click', () => closeGuide());
panelScrim.addEventListener('click', () => {
  if (document.body.classList.contains('picker-open')) closePicker();
  if (document.body.classList.contains('guide-open')) closeGuide();
});

guideForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) {
    questionInput.focus();
    return;
  }
  await requestGuide(question);
  if (guideMessage.hidden) questionInput.value = '';
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (document.body.classList.contains('picker-open')) closePicker();
  else if (document.body.classList.contains('guide-open')) closeGuide();
});

canvas.addEventListener('pointerdown', () => document.body.classList.add('is-interacting'));
window.addEventListener('pointerup', () => document.body.classList.remove('is-interacting'));

canvas.addEventListener('keydown', (event) => {
  const rotateStep = 0.1;
  if (event.key === 'ArrowLeft') controls.rotateLeft(rotateStep);
  else if (event.key === 'ArrowRight') controls.rotateLeft(-rotateStep);
  else if (event.key === 'ArrowUp') controls.rotateUp(rotateStep * 0.6);
  else if (event.key === 'ArrowDown') controls.rotateUp(-rotateStep * 0.6);
  else if (event.key === '+' || event.key === '=') camera.position.multiplyScalar(0.96);
  else if (event.key === '-' || event.key === '_') camera.position.multiplyScalar(1.04);
  else if (event.key === 'Home') resetView();
  else return;

  event.preventDefault();
  setAutoRotate(false);
  controls.update();
});

function resize() {
  const rect = viewer.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 700 ? 41 : 33;
  camera.updateProjectionMatrix();
  controls.update();
}

new ResizeObserver(resize).observe(viewer);

const clock = new THREE.Clock();
function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  if (mixer) mixer.update(delta);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

const requestedAnimal = new URLSearchParams(window.location.search).get('animal');
if (requestedAnimal && animals[requestedAnimal]) currentAnimalId = requestedAnimal;
buildAnimalGrid();
resize();
loadAnimal(currentAnimalId);
animate();
