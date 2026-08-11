import * as THREE from 'three';

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101014);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- load the art list + optional descriptions ----------
const [files, descriptions] = await Promise.all([
  fetch('/gallery/art/manifest.json').then(r => r.json()).catch(() => []),
  fetch('/gallery/art/descriptions.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
]);
const loader = new THREE.TextureLoader();

function descriptionFor(file) {
  const noExt = file.replace(/\.[^.]+$/, '');
  const entry = descriptions[file] ?? descriptions[noExt];
  if (!entry) return { title: noExt, text: '' };
  if (typeof entry === 'string') return { title: noExt, text: entry };
  return { title: entry.title || noExt, text: entry.description || '' };
}

async function loadArtworks() {
  if (files.length === 0) return placeholderArtworks(6);
  const results = await Promise.all(files.map(f =>
    new Promise(resolve => {
      loader.load(`/gallery/art/${encodeURIComponent(f)}`, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const d = descriptionFor(f);
        resolve({ name: d.title, description: d.text, texture: tex });
      }, undefined, () => resolve(null));
    })
  ));
  return results.filter(Boolean);
}

function placeholderArtworks(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 640;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 512, 640);
    const hue = (i * 57) % 360;
    grad.addColorStop(0, `hsl(${hue}, 45%, 35%)`);
    grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 55%, 18%)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 640);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.font = '28px system-ui';
    g.textAlign = 'center';
    g.fillText('Drop images into the', 256, 300);
    g.fillText('"art" folder to hang', 256, 340);
    g.fillText('them here', 256, 380);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    out.push({ name: `Empty frame ${i + 1}`, description: '', texture: tex });
  }
  return out;
}

const artworks = await loadArtworks();

// ---------- gallery layout: a row of rooms joined by doorways ----------
const ROOM_W = 16, ROOM_D = 16, ROOM_H = 5.5;
const DOOR_W = 3, DOOR_H = 3.4;
const ART_H = 2.2, SLOT = 3.6;
const WALL_CAP = 3; // paintings per hangable wall

// each room contributes 2 side walls; the two gallery ends add 2 more
const numRooms = Math.max(1, Math.ceil((artworks.length - 2 * WALL_CAP) / (2 * WALL_CAP)));
const roomZ = r => r * ROOM_D;
const Z_MIN = -ROOM_D / 2;
const Z_MAX = roomZ(numRooms - 1) + ROOM_D / 2;
const TOTAL_D = Z_MAX - Z_MIN;

const wallMat = new THREE.MeshStandardMaterial({ color: 0xdedad2, roughness: 0.95 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.6 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a3733, roughness: 0.35, metalness: 0.1 });

const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, TOTAL_D), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.z = (Z_MIN + Z_MAX) / 2;
floor.receiveShadow = true;
scene.add(floor);

const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, TOTAL_D),
  new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 1 }));
ceiling.rotation.x = Math.PI / 2;
ceiling.position.set(0, ROOM_H, (Z_MIN + Z_MAX) / 2);
scene.add(ceiling);

// collision boxes: {x, z, hx, hz} half-extents on the ground plane
const colliders = [];

function addWallPlane(width, pos, rotY) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, ROOM_H), wallMat);
  mesh.position.set(...pos);
  mesh.rotation.y = rotY;
  mesh.receiveShadow = true;
  scene.add(mesh);
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, 0.06), trimMat);
  base.position.set(pos[0], 0.09, pos[2]);
  base.rotation.y = rotY;
  base.translateZ(0.03);
  scene.add(base);
}

// exterior walls
addWallPlane(ROOM_W, [0, ROOM_H / 2, Z_MIN], 0);
addWallPlane(ROOM_W, [0, ROOM_H / 2, Z_MAX], Math.PI);
addWallPlane(TOTAL_D, [-ROOM_W / 2, ROOM_H / 2, (Z_MIN + Z_MAX) / 2], Math.PI / 2);
addWallPlane(TOTAL_D, [ROOM_W / 2, ROOM_H / 2, (Z_MIN + Z_MAX) / 2], -Math.PI / 2);
colliders.push(
  { x: 0, z: Z_MIN, hx: ROOM_W / 2, hz: 0.15 },
  { x: 0, z: Z_MAX, hx: ROOM_W / 2, hz: 0.15 },
  { x: -ROOM_W / 2, z: (Z_MIN + Z_MAX) / 2, hx: 0.15, hz: TOTAL_D / 2 },
  { x: ROOM_W / 2, z: (Z_MIN + Z_MAX) / 2, hx: 0.15, hz: TOTAL_D / 2 },
);

// interior dividing walls, each with a central doorway
const segW = (ROOM_W - DOOR_W) / 2;
const doubleWallMat = new THREE.MeshStandardMaterial({ color: 0xdedad2, roughness: 0.95 });
for (let r = 0; r < numRooms - 1; r++) {
  const zb = roomZ(r) + ROOM_D / 2;
  for (const side of [-1, 1]) {
    const cx = side * (DOOR_W / 2 + segW / 2);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(segW, ROOM_H, 0.3), doubleWallMat);
    seg.position.set(cx, ROOM_H / 2, zb);
    seg.castShadow = seg.receiveShadow = true;
    scene.add(seg);
    colliders.push({ x: cx, z: zb, hx: segW / 2, hz: 0.15 });
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, ROOM_H - DOOR_H, 0.3), doubleWallMat);
  lintel.position.set(0, DOOR_H + (ROOM_H - DOOR_H) / 2, zb);
  scene.add(lintel);
  const doorTrim = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W + 0.2, 0.12, 0.36), trimMat);
  doorTrim.position.set(0, DOOR_H + 0.06, zb);
  scene.add(doorTrim);
}

// circle-vs-box pushout, used for the character and the camera
function pushOut(pos, radius) {
  for (const b of colliders) {
    const cx = Math.min(b.x + b.hx, Math.max(b.x - b.hx, pos.x));
    const cz = Math.min(b.z + b.hz, Math.max(b.z - b.hz, pos.z));
    const dx = pos.x - cx, dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      pos.x = cx + (dx / d) * radius;
      pos.z = cz + (dz / d) * radius;
    } else {
      pos.z = b.z + (pos.z >= b.z ? b.hz + radius : -(b.hz + radius));
    }
  }
}

// ---------- hangable walls, in walking order ----------
const hangWalls = [];
hangWalls.push({ center: [0, 2.0, Z_MIN], rotY: 0 });
for (let r = 0; r < numRooms; r++) {
  hangWalls.push({ center: [-ROOM_W / 2, 2.0, roomZ(r)], rotY: Math.PI / 2 });
  hangWalls.push({ center: [ROOM_W / 2, 2.0, roomZ(r)], rotY: -Math.PI / 2 });
}
hangWalls.push({ center: [0, 2.0, Z_MAX], rotY: Math.PI });

// spread paintings across walls proportionally, preserving order
const byWall = hangWalls.map(() => []);
artworks.forEach((art, i) => {
  const w = Math.min(hangWalls.length - 1, Math.floor(i * hangWalls.length / artworks.length));
  byWall[w].push(art);
});

// ---------- hang the paintings with frames, plaques, spotlights ----------
const frameMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4, metalness: 0.4 });
const paintings = []; // { pos, name, spot }

function makePlaqueTexture(title, text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 352;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, 512, 352);
  g.strokeStyle = '#c9c4b8';
  g.lineWidth = 6;
  g.strokeRect(6, 6, 500, 340);
  g.fillStyle = '#2a2a2e';
  g.font = 'bold 34px Georgia, serif';
  g.fillText(title, 30, 66, 452);
  g.font = '24px Georgia, serif';
  g.fillStyle = '#4a4a50';
  let line = '', y = 116;
  for (const word of (text || 'No description yet.').split(/\s+/)) {
    const test = line ? line + ' ' + word : word;
    if (g.measureText(test).width > 452 && line) {
      g.fillText(line, 30, y);
      y += 32;
      line = word;
      if (y > 320) { line += ' …'; break; }
    } else line = test;
  }
  if (line) g.fillText(line, 30, y);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

byWall.forEach((arts, wi) => {
  const wall = hangWalls[wi];
  arts.forEach((art, j) => {
    const offset = (j - (arts.length - 1) / 2) * SLOT;
    const img = art.texture.image;
    const aspect = (img && img.width && img.height) ? img.width / img.height : 0.8;
    const h = ART_H;
    const w = Math.min(ART_H * aspect, SLOT - 0.6);

    const group = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.08), frameMat);
    frame.castShadow = true;
    group.add(frame);
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: art.texture }));
    canvas.position.z = 0.045;
    group.add(canvas);

    // info plaque beside the painting
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.45),
      new THREE.MeshBasicMaterial({ map: makePlaqueTexture(art.name, art.description) }));
    plaque.position.set(w / 2 + 0.5, -0.5, 0.03);
    group.add(plaque);

    group.position.set(...wall.center);
    group.rotation.y = wall.rotY;
    group.translateX(offset);
    group.translateZ(0.06);
    scene.add(group);

    const worldPos = new THREE.Vector3();
    group.getWorldPosition(worldPos);

    const spot = new THREE.SpotLight(0xfff1dc, 25, 10, 0.55, 0.5, 1.6);
    spot.position.set(worldPos.x, ROOM_H - 0.4, worldPos.z);
    spot.target = group;
    scene.add(spot);

    paintings.push({ pos: worldPos, name: art.name, spot });
  });
});

// ---------- lighting ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
scene.add(new THREE.HemisphereLight(0xcfd6e6, 0x2b2620, 0.5));
for (let r = 0; r < numRooms; r++) {
  const key = new THREE.PointLight(0xfff4e0, 30, 0, 1.8);
  key.position.set(0, ROOM_H - 0.6, roomZ(r));
  if (r === 0) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
  }
  scene.add(key);
}

// ---------- third-person character ----------
const character = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9a4a3c, roughness: 0.7 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a184, roughness: 0.8 });
const legMat = new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.8 });

const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 8, 16), bodyMat);
torso.position.y = 1.05;
torso.castShadow = true;
character.add(torso);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), skinMat);
head.position.y = 1.62;
head.castShadow = true;
character.add(head);

const legs = [];
for (const side of [-1, 1]) {
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 6, 12), legMat);
  leg.position.set(side * 0.12, 0.42, 0);
  leg.castShadow = true;
  character.add(leg);
  legs.push(leg);
}
const arms = [];
for (const side of [-1, 1]) {
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.38, 6, 12), bodyMat);
  arm.position.set(side * 0.32, 1.08, 0);
  arm.castShadow = true;
  character.add(arm);
  arms.push(arm);
}
scene.add(character);

// ---------- footstep sounds (procedural, no audio files) ----------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
addEventListener('pointerdown', ensureAudio);
addEventListener('keydown', ensureAudio);

function footstep(running) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const dur = 0.09;
  const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320 + Math.random() * 240;
  const gain = audioCtx.createGain();
  gain.gain.value = running ? 0.5 : 0.28;
  src.connect(filter).connect(gain).connect(audioCtx.destination);
  src.start();
}

// ---------- input ----------
const keys = {};
addEventListener('keydown', e => keys[e.code] = true);
addEventListener('keyup', e => keys[e.code] = false);

let yaw = 0, pitch = 0.25, camDist = 5;

// look: drag with the mouse or one finger; two fingers pinch to zoom
const lookPointers = new Map();
renderer.domElement.addEventListener('pointerdown', e => {
  lookPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
});
addEventListener('pointermove', e => {
  const p = lookPointers.get(e.pointerId);
  if (!p) return;
  if (lookPointers.size === 2) {
    const [a, b] = [...lookPointers.values()];
    const before = Math.hypot(a.x - b.x, a.y - b.y);
    p.x = e.clientX; p.y = e.clientY;
    const after = Math.hypot(a.x - b.x, a.y - b.y);
    camDist = Math.min(10, Math.max(0.8, camDist + (before - after) * 0.02));
  } else {
    yaw -= (e.clientX - p.x) * 0.005;
    pitch = Math.min(1.2, Math.max(-0.1, pitch + (e.clientY - p.y) * 0.005));
    p.x = e.clientX; p.y = e.clientY;
  }
});
addEventListener('pointerup', e => lookPointers.delete(e.pointerId));
addEventListener('pointercancel', e => lookPointers.delete(e.pointerId));
addEventListener('wheel', e => {
  camDist = Math.min(10, Math.max(0.8, camDist + e.deltaY * 0.003));
});

// touch joystick (visible only on coarse-pointer devices, see index.html)
const joyEl = document.getElementById('joystick');
const stickEl = document.getElementById('stick');
let joyX = 0, joyY = 0, joyId = null;
if (joyEl) {
  const setStick = (dx, dy) => { stickEl.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`; };
  const updateJoy = e => {
    const r = joyEl.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    joyX = dx; joyY = dy;
    setStick(dx, dy);
  };
  joyEl.addEventListener('pointerdown', e => {
    joyId = e.pointerId;
    joyEl.setPointerCapture(e.pointerId);
    updateJoy(e);
  });
  joyEl.addEventListener('pointermove', e => { if (e.pointerId === joyId) updateJoy(e); });
  const endJoy = e => {
    if (e.pointerId !== joyId) return;
    joyId = null; joyX = 0; joyY = 0; setStick(0, 0);
  };
  joyEl.addEventListener('pointerup', endJoy);
  joyEl.addEventListener('pointercancel', endJoy);
}

// ---------- caption ----------
const captionEl = document.getElementById('caption');
let captionShown = '';

// ---------- main loop ----------
const clock = new THREE.Clock();
let heading = 0;
let walkPhase = 0;
let prevSwingSign = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  let forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  let strafe = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let running = keys.ShiftLeft || keys.ShiftRight;
  const joyMag = Math.hypot(joyX, joyY);
  if (joyMag > 0.15) {
    forward = -joyY;
    strafe = joyX;
    if (joyMag > 0.95) running = true; // stick pushed to the rim
  }
  const moving = Math.abs(forward) > 0.01 || Math.abs(strafe) > 0.01;
  const speed = running ? 5.2 : 2.6;

  if (moving) {
    const dir = new THREE.Vector3(strafe, 0, -forward)
      .normalize()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    character.position.addScaledVector(dir, speed * dt);
    heading = Math.atan2(dir.x, dir.z);
  }
  pushOut(character.position, 0.35);

  let d = heading - character.rotation.y;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  character.rotation.y += d * Math.min(1, dt * 12);

  // walk cycle + footsteps on each leg swing reversal
  walkPhase = moving ? walkPhase + dt * speed * 3.2 : 0;
  const swing = moving ? Math.sin(walkPhase) * 0.5 : 0;
  const sign = Math.sign(Math.sin(walkPhase));
  if (moving && sign !== 0 && sign !== prevSwingSign && prevSwingSign !== 0) footstep(running);
  prevSwingSign = moving ? sign : 0;
  legs[0].rotation.x = swing;
  legs[1].rotation.x = -swing;
  arms[0].rotation.x = -swing * 0.7;
  arms[1].rotation.x = swing * 0.7;
  torso.position.y = 1.05 + (moving ? Math.abs(Math.sin(walkPhase)) * 0.04 : 0);

  // camera orbit behind the character
  const target = character.position.clone().add(new THREE.Vector3(0, 1.4, 0));
  const camOff = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  ).multiplyScalar(camDist);
  const camPos = target.clone().add(camOff);
  camPos.x = Math.min(ROOM_W / 2 - 0.3, Math.max(-ROOM_W / 2 + 0.3, camPos.x));
  camPos.z = Math.min(Z_MAX - 0.3, Math.max(Z_MIN + 0.3, camPos.z));
  camPos.y = Math.min(ROOM_H - 0.3, Math.max(0.4, camPos.y));
  pushOut(camPos, 0.25);
  camera.position.lerp(camPos, 1 - Math.pow(0.001, dt));
  camera.lookAt(target);

  // hide the character when the camera is zoomed right in, so it
  // doesn't block close-up reading of paintings and plaques
  character.visible = camera.position.distanceTo(target) > 1.4;

  // nearest painting: caption + spotlight brightens
  let nearest = null, best = 4.5;
  for (const p of paintings) {
    const dist = p.pos.distanceTo(character.position);
    if (dist < best) { best = dist; nearest = p; }
  }
  for (const p of paintings) {
    const targetI = p === nearest ? 45 : 25;
    p.spot.intensity += (targetI - p.spot.intensity) * Math.min(1, dt * 6);
  }
  const label = nearest ? nearest.name : '';
  if (label !== captionShown) {
    captionShown = label;
    captionEl.textContent = label;
    captionEl.style.opacity = label ? 1 : 0;
  }

  renderer.render(scene, camera);
}
animate();
