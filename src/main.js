import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xc7d9ee, 0.0009);
renderer.setClearColor(new THREE.Color(0x97bbdf));

const camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.1, 4000);

const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6284a8, 1.1);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2db, 2.4);
sun.position.set(-220, 340, 90);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 900;
sun.shadow.camera.left = -350;
sun.shadow.camera.right = 350;
sun.shadow.camera.top = 350;
sun.shadow.camera.bottom = -350;
scene.add(sun);

const WORLD = {
  size: 2600,
  heightScale: 185,
  liftTop: new THREE.Vector3(320, 0, -760),
  liftBottom: new THREE.Vector3(-400, 0, 460),
};

const snowTexture = (() => {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#f8fbff');
  grad.addColorStop(1, '#d9e6f5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4500; i++) {
    const alpha = Math.random() * 0.08;
    ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 0.4 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
})();

snowTexture.wrapS = snowTexture.wrapT = THREE.RepeatWrapping;
snowTexture.repeat.set(28, 28);

function sampleHeight(x, z) {
  const ridges = Math.sin(x * 0.006) * 0.32 + Math.sin(z * 0.0053 + x * 0.0014) * 0.22;
  const macroSlope = (-(z + 240) / WORLD.size + 0.38) * 1.35;
  const cliffs = Math.max(0, Math.sin((x + z) * 0.013) - 0.78) * 0.75;
  const bowls = Math.cos(Math.hypot(x * 0.0015, z * 0.0012) * 12) * 0.07;
  return (ridges + macroSlope + cliffs + bowls) * WORLD.heightScale;
}

function slopeAt(x, z) {
  const eps = 1.2;
  const hx = sampleHeight(x + eps, z) - sampleHeight(x - eps, z);
  const hz = sampleHeight(x, z + eps) - sampleHeight(x, z - eps);
  return new THREE.Vector3(-hx, 2 * eps, -hz).normalize();
}

const terrainGeo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, 256, 256);
terrainGeo.rotateX(-Math.PI / 2);
const pos = terrainGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);
  pos.setY(i, sampleHeight(x, z));
}
terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(
  terrainGeo,
  new THREE.MeshStandardMaterial({
    color: 0xf2f8ff,
    map: snowTexture,
    roughness: 0.76,
    metalness: 0.04,
    envMapIntensity: 0.5,
  })
);
terrain.receiveShadow = true;
scene.add(terrain);

function createPine(x, z, scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35 * scale, 0.55 * scale, 4.2 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x5f4128, roughness: 0.95 })
  );
  trunk.position.y = 2.1 * scale;

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(2.7 * scale, 9.4 * scale, 9),
    new THREE.MeshStandardMaterial({ color: 0x284f2e, roughness: 1 })
  );
  leaves.position.y = 8.5 * scale;
  group.add(trunk, leaves);

  group.position.set(x, sampleHeight(x, z), z);
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(group);
}

for (let i = 0; i < 950; i++) {
  const x = (Math.random() - 0.5) * WORLD.size * 0.92;
  const z = (Math.random() - 0.5) * WORLD.size * 0.92;
  const nearVillage = Math.hypot(x + 380, z - 520) < 230;
  const highAlpine = z < -900;
  if (!nearVillage && !highAlpine && Math.random() > 0.22) {
    createPine(x, z, 0.7 + Math.random() * 1.15);
  }
}

function createVillage() {
  const village = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CircleGeometry(170, 48),
    new THREE.MeshStandardMaterial({ color: 0xe4edf6, roughness: 0.9 })
  );
  base.rotateX(-Math.PI / 2);
  base.position.set(-390, sampleHeight(-390, 520) + 0.6, 520);
  village.add(base);

  for (let i = 0; i < 22; i++) {
    const lodge = new THREE.Mesh(
      new THREE.BoxGeometry(12 + Math.random() * 16, 8 + Math.random() * 7, 9 + Math.random() * 15),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.07, 0.2, 0.34 + Math.random() * 0.14) })
    );
    const ang = Math.random() * Math.PI * 2;
    const rad = 36 + Math.random() * 105;
    lodge.position.set(-390 + Math.cos(ang) * rad, 0, 520 + Math.sin(ang) * rad);
    lodge.position.y = sampleHeight(lodge.position.x, lodge.position.z) + lodge.geometry.parameters.height / 2;
    lodge.rotation.y = Math.random() * Math.PI;
    lodge.castShadow = true;
    lodge.receiveShadow = true;
    village.add(lodge);
  }
  scene.add(village);
}
createVillage();

function createLift() {
  const lift = new THREE.Group();
  const ropePts = [];
  const segments = 26;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(WORLD.liftBottom, WORLD.liftTop, t);
    p.y = sampleHeight(p.x, p.z) + 14 + Math.sin(t * Math.PI) * 14;
    ropePts.push(p);

    if (i % 4 === 0 || i === 0 || i === segments) {
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 20 + Math.random() * 8, 2.6),
        new THREE.MeshStandardMaterial({ color: 0x6f7988, roughness: 0.8 })
      );
      tower.position.copy(p);
      tower.position.y -= 10;
      tower.castShadow = true;
      lift.add(tower);
    }
  }

  const rope = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ropePts),
    new THREE.LineBasicMaterial({ color: 0x2c3646 })
  );
  lift.add(rope);

  const chairs = [];
  for (let i = 0; i < 10; i++) {
    const seat = new THREE.Group();
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 3.1, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x3d4656 })
    );
    bar.position.y = 1.5;
    const chair = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.35, 1),
      new THREE.MeshStandardMaterial({ color: 0x1d2230 })
    );
    seat.add(bar, chair);
    seat.castShadow = true;
    lift.add(seat);
    chairs.push({ mesh: seat, t: i / 10 });
  }

  scene.add(lift);
  return { chairs, ropePts };
}
const liftState = createLift();

const player = {
  id: crypto.randomUUID(),
  pos: new THREE.Vector3(-360, 0, 540),
  vel: new THREE.Vector3(),
  heading: 0,
  lean: 0,
  onLift: false,
  liftT: 0,
};
player.pos.y = sampleHeight(player.pos.x, player.pos.z) + 1.1;

const skier = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.45, 1.4, 5, 10),
  new THREE.MeshStandardMaterial({ color: 0xf24f64, roughness: 0.62 })
);
body.castShadow = true;
body.position.y = 1.8;
const skis = new THREE.Mesh(
  new THREE.BoxGeometry(1.9, 0.07, 0.19),
  new THREE.MeshStandardMaterial({ color: 0x202631, roughness: 0.4 })
);
skis.position.y = 0.35;
skier.add(body, skis);
scene.add(skier);

const keys = new Map();
window.addEventListener('keydown', (e) => keys.set(e.code, true));
window.addEventListener('keyup', (e) => keys.set(e.code, false));

const pads = { x: 0, carve: 0, brake: 0 };
function pollGamepad() {
  const gp = navigator.getGamepads?.()[0];
  pads.x = gp?.axes?.[0] ?? 0;
  pads.carve = gp?.buttons?.[7]?.value ?? 0;
  pads.brake = gp?.buttons?.[0]?.value ?? 0;
}

const aiPlayers = [];
for (let i = 0; i < 8; i++) {
  const bot = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1.2, 4, 8),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.52 + Math.random() * 0.25, 0.65, 0.55) })
  );
  bot.castShadow = true;
  bot.userData.pos = new THREE.Vector3(-200 + Math.random() * 500, 0, -900 + Math.random() * 1800);
  bot.userData.vel = new THREE.Vector3();
  bot.userData.phase = Math.random() * Math.PI * 2;
  aiPlayers.push(bot);
  scene.add(bot);
}

const networkPlayers = new Map();

function createRemoteMesh(id) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 1.25, 4, 8),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.56) })
  );
  mesh.castShadow = true;
  mesh.userData.id = id;
  mesh.userData.targetPos = player.pos.clone();
  mesh.userData.targetHeading = 0;
  scene.add(mesh);
  return mesh;
}

const snowField = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({ color: 0xf8fcff, size: 1.7, sizeAttenuation: true, transparent: true, opacity: 0.45 })
);
{
  const count = 1600;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 900;
    arr[i * 3 + 1] = 20 + Math.random() * 220;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 900;
  }
  snowField.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
}
scene.add(snowField);

const SUPABASE_URL = window.__SUPABASE_URL__ ?? localStorage.getItem('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ ?? localStorage.getItem('SUPABASE_ANON_KEY') ?? '';
const network = {
  enabled: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  client: null,
  channel: null,
  sendTimer: 0,
  onlineCount: 1,
};

if (network.enabled) {
  network.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 25 } },
  });

  network.channel = network.client.channel('alpine-flow', {
    config: { presence: { key: player.id }, broadcast: { self: false } },
  });

  network.channel
    .on('presence', { event: 'sync' }, () => {
      const state = network.channel.presenceState();
      network.onlineCount = Math.max(1, Object.keys(state).length);
    })
    .on('presence', { event: 'leave' }, (payload) => {
      const ids = payload.leftPresences?.map((p) => p.id).filter(Boolean) ?? [];
      ids.forEach((id) => {
        const entry = networkPlayers.get(id);
        if (entry) {
          scene.remove(entry.mesh);
          networkPlayers.delete(id);
        }
      });
    })
    .on('broadcast', { event: 'player_state' }, ({ payload }) => {
      if (!payload || payload.id === player.id) return;
      let entry = networkPlayers.get(payload.id);
      if (!entry) {
        entry = { mesh: createRemoteMesh(payload.id), lastUpdate: performance.now() };
        networkPlayers.set(payload.id, entry);
      }
      entry.lastUpdate = performance.now();
      entry.mesh.userData.targetPos.set(payload.x, payload.y, payload.z);
      entry.mesh.userData.targetHeading = payload.heading;
      entry.mesh.visible = true;
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await network.channel.track({ id: player.id, joinedAt: Date.now() });
      }
    });
}

function sendNetworkState(dt) {
  if (!network.enabled || !network.channel) return;
  network.sendTimer += dt;
  if (network.sendTimer < 0.085) return;
  network.sendTimer = 0;

  network.channel.send({
    type: 'broadcast',
    event: 'player_state',
    payload: {
      id: player.id,
      x: player.pos.x,
      y: player.pos.y,
      z: player.pos.z,
      heading: player.heading,
      speed: player.vel.length(),
      t: Date.now(),
    },
  });
}

function updateRemotePlayers(dt) {
  const staleAfterMs = 9000;
  const now = performance.now();
  networkPlayers.forEach((entry, id) => {
    if (now - entry.lastUpdate > staleAfterMs) {
      scene.remove(entry.mesh);
      networkPlayers.delete(id);
      return;
    }
    entry.mesh.position.lerp(entry.mesh.userData.targetPos, Math.min(1, dt * 8));
    const delta = entry.mesh.userData.targetHeading - entry.mesh.rotation.y;
    entry.mesh.rotation.y += delta * Math.min(1, dt * 8);
  });
}

function updateLift(dt) {
  liftState.chairs.forEach((c) => {
    c.t = (c.t + dt * 0.022) % 1;
    const idx = c.t * (liftState.ropePts.length - 1);
    const low = Math.floor(idx);
    const hi = Math.min(low + 1, liftState.ropePts.length - 1);
    c.mesh.position.lerpVectors(liftState.ropePts[low], liftState.ropePts[hi], idx - low);
  });
}

function handlePlayer(dt) {
  pollGamepad();
  const turnInput = (keys.get('KeyA') ? 1 : 0) - (keys.get('KeyD') ? 1 : 0) - pads.x;
  const carve = (keys.get('ShiftLeft') || keys.get('ShiftRight') ? 1 : 0) + pads.carve;
  const brake = (keys.get('Space') ? 1 : 0) + pads.brake;

  if (player.onLift) {
    player.liftT += dt * 0.043;
    if (player.liftT >= 1) {
      player.liftT = 0;
      player.onLift = false;
      player.pos.copy(WORLD.liftTop).add(new THREE.Vector3(8, 0, 18));
    } else {
      const p = new THREE.Vector3().lerpVectors(WORLD.liftBottom, WORLD.liftTop, player.liftT);
      p.y = sampleHeight(p.x, p.z) + 13 + Math.sin(player.liftT * Math.PI) * 13;
      player.pos.copy(p);
      player.vel.multiplyScalar(0.9);
    }
  } else {
    const normal = slopeAt(player.pos.x, player.pos.z);
    const downhill = new THREE.Vector3(0, -9.8, 0).projectOnPlane(normal).multiplyScalar(0.42);

    player.heading += turnInput * dt * (1.5 + Math.min(player.vel.length() * 0.03, 1.4));
    player.lean = THREE.MathUtils.lerp(player.lean, turnInput * 0.52, dt * 5);

    const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
    player.vel.addScaledVector(downhill, dt * 34);
    player.vel.addScaledVector(forward, dt * 3.6);

    const drag = 0.985 - carve * 0.05 - Math.abs(turnInput) * 0.03 - brake * 0.08;
    player.vel.multiplyScalar(Math.max(0.9, drag));
    player.vel.y = 0;

    player.pos.addScaledVector(player.vel, dt);
    player.pos.y = sampleHeight(player.pos.x, player.pos.z) + 0.8;

    const liftBase = new THREE.Vector3(
      WORLD.liftBottom.x,
      sampleHeight(WORLD.liftBottom.x, WORLD.liftBottom.z),
      WORLD.liftBottom.z
    );
    if (player.pos.distanceTo(liftBase) < 18 && keys.get('KeyE')) {
      player.onLift = true;
      player.liftT = 0;
    }

    if (player.pos.length() > WORLD.size * 0.65) {
      player.pos.multiplyScalar(0.98);
      player.vel.multiplyScalar(0.9);
    }
  }

  skier.position.copy(player.pos);
  skier.rotation.y = player.heading;
  skier.rotation.z = player.lean;
}

function updateAI(dt) {
  aiPlayers.forEach((bot, idx) => {
    const p = bot.userData.pos;
    const v = bot.userData.vel;
    const steer = Math.sin(performance.now() * 0.00025 + bot.userData.phase + idx) * 0.9;
    const heading = steer + Math.sin((p.z + idx * 15) * 0.009) * 0.3;
    const dir = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    const norm = slopeAt(p.x, p.z);
    const grav = new THREE.Vector3(0, -9.8, 0).projectOnPlane(norm).multiplyScalar(0.36);

    v.addScaledVector(grav, dt * 24);
    v.addScaledVector(dir, dt * 2.2);
    v.multiplyScalar(0.982);
    p.addScaledVector(v, dt);

    if (p.z > 700 || p.length() > WORLD.size * 0.66) {
      p.set(-300 + Math.random() * 650, 0, -980 + Math.random() * 220);
      v.set(0, 0, 0);
    }

    p.y = sampleHeight(p.x, p.z) + 0.75;
    bot.position.lerp(p, Math.min(1, dt * 7));
    bot.rotation.y = Math.atan2(v.x, v.z);
    bot.rotation.z = THREE.MathUtils.clamp(-v.x * 0.03, -0.45, 0.45);
  });
}

function updateSnow(dt) {
  const arr = snowField.geometry.attributes.position.array;
  for (let i = 0; i < arr.length; i += 3) {
    arr[i] += dt * 5;
    arr[i + 1] -= dt * 18;
    if (arr[i + 1] < 0) {
      arr[i + 1] = 220;
      arr[i] = player.pos.x + (Math.random() - 0.5) * 950;
      arr[i + 2] = player.pos.z + (Math.random() - 0.5) * 950;
    }
  }
  snowField.geometry.attributes.position.needsUpdate = true;
  snowField.position.set(player.pos.x, 0, player.pos.z);
}

function updateCamera(dt) {
  const target = player.pos.clone();
  const dir = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  const camPos = target
    .clone()
    .addScaledVector(dir, -18)
    .add(new THREE.Vector3(0, 8 + Math.min(player.vel.length() * 0.15, 4), 0));
  camera.position.lerp(camPos, Math.min(1, dt * 3.2));
  camera.lookAt(target.x, target.y + 2.2, target.z);
  camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, player.lean * 0.23, dt * 3.5);
}

function updateStatus() {
  const networkMode = network.enabled ? `Supabase online: ${network.onlineCount}` : 'Offline sim mode';
  statusEl.textContent = `${networkMode} • AI skiers: ${aiPlayers.length} • Press E near lift to ride`;
}

let last = performance.now();
updateStatus();

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  updateLift(dt);
  handlePlayer(dt);
  updateAI(dt);
  updateRemotePlayers(dt);
  sendNetworkState(dt);
  updateSnow(dt);
  updateCamera(dt);
  updateStatus();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('beforeunload', async () => {
  if (network.channel) await network.channel.untrack();
});

requestAnimationFrame(loop);
