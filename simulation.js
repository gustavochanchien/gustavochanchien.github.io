// simulation.js
import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

/**
 * Lantern simulation mounted into the hero media box.
 * Container should be the element with [data-hero-sim] (e.g. #hero-sim-container).
 */
function initLanternSimulation(container) {
  // ---------------------------------------------------------
  // Helpers for sizing
  // ---------------------------------------------------------
  function getSize() {
    const rect = container.getBoundingClientRect();
    const width = rect.width || container.clientWidth || 800;
    const height = rect.height || container.clientHeight || 400;
    return { width, height };
  }

  const initialSize = getSize();

  // ---------------------------------------------------------
  // Scene / renderer / camera
  // ---------------------------------------------------------
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    initialSize.width / initialSize.height,
    0.1,
    100
  );
  camera.position.set(0, 5, 22);
  camera.lookAt(0, 5, 0);

  // Adaptive DPR cap (helps mobile a lot)
  let targetDPR = Math.min(window.devicePixelRatio || 1, 2);
  if (initialSize.width < 700) targetDPR = Math.min(targetDPR, 1.25);
  if (initialSize.width < 500) targetDPR = Math.min(targetDPR, 1.1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(targetDPR);
  renderer.setSize(initialSize.width, initialSize.height);

  // Shadows are expensive with lots of moving meshes; keep them but cheaper.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  container.appendChild(renderer.domElement);

  // Theme-aware environment + lighting are set up below the lights.

  // ---------------------------------------------------------
  // UI: pause / play
  // ---------------------------------------------------------
  const pauseBtn =
    container.closest(".hero-media")?.querySelector("[data-sim-pause]") || null;
  let paused = false;

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      paused = !paused;
      pauseBtn.textContent = paused ? "Play" : "Pause";
    });
  }

  // ---------------------------------------------------------
  // Lights + theme-aware environment
  // ---------------------------------------------------------
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfff0e0, 1.25);
  dirLight.position.set(6, 12, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(512, 512);
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  scene.add(dirLight);

  // PMREM-based environment that swaps when the page theme changes.
  const pmrem = new THREE.PMREMGenerator(renderer);
  let currentEnvRT = null;

  // Declared up-front so applyTheme() can update per-balloon emissive
  // uniforms whenever the theme flips.
  const lanterns = [];
  let lanternEmissiveStrength = 0;

  function makeSkyTexture(theme) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    if (theme === "dark") {
      g.addColorStop(0.0, "#1a2540");
      g.addColorStop(0.4, "#0a0e26");
      g.addColorStop(0.75, "#05060f");
      g.addColorStop(1.0, "#000000");
    } else {
      g.addColorStop(0.0, "#7fb8ff");
      g.addColorStop(0.3, "#a88cff");
      g.addColorStop(0.55, "#ffd1e8");
      g.addColorStop(0.78, "#cfe9ff");
      g.addColorStop(1.0, "#ffffff");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  function applyTheme(theme) {
    const skyTex = makeSkyTexture(theme);
    const envRT = pmrem.fromEquirectangular(skyTex);
    if (currentEnvRT) currentEnvRT.dispose();
    currentEnvRT = envRT;
    scene.environment = envRT.texture;
    skyTex.dispose();

    if (theme === "dark") {
      ambientLight.intensity = 0.45;
      dirLight.intensity = 0.85;
      dirLight.color.setHex(0xc8d4ff);
      renderer.toneMappingExposure = 0.85;
      lanternEmissiveStrength = 1.4;
    } else {
      ambientLight.intensity = 0.9;
      dirLight.intensity = 1.25;
      dirLight.color.setHex(0xfff0e0);
      renderer.toneMappingExposure = 1.0;
      lanternEmissiveStrength = 0.0;
    }

    for (let i = 0; i < lanterns.length; i++) {
      const u = lanterns[i].userData.material.userData.uniforms;
      if (u && u.uEmissiveStrength) {
        u.uEmissiveStrength.value = lanternEmissiveStrength;
      }
    }
  }

  const getTheme = () =>
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";

  applyTheme(getTheme());

  const themeObserver = new MutationObserver(() => applyTheme(getTheme()));
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // ---------------------------------------------------------
  // Geometry: hot air balloon envelope (lathe) + gondola box
  // (Geometry/material logic adapted from /balloon-simulator)
  // ---------------------------------------------------------
  const balloonScale = 0.95;
  const radialSegments = 18;

  const envelopeProfile = [
    [0.07, -0.62],
    [0.12, -0.52],
    [0.33, -0.28],
    [0.48,  0.00],
    [0.44,  0.26],
    [0.30,  0.50],
    [0.03,  0.62],
  ].map(([r, y]) => new THREE.Vector2(r * balloonScale, y * balloonScale));

  const lanternGeo = new THREE.LatheGeometry(envelopeProfile, radialSegments);
  lanternGeo.computeVertexNormals();
  lanternGeo.computeBoundingBox();

  const lanternMinY = lanternGeo.boundingBox.min.y;
  const lanternMaxY = lanternGeo.boundingBox.max.y;
  const lanternHeightRange = (lanternMaxY - lanternMinY) || 1;
  const envelopeWidth = (lanternGeo.boundingBox.max.x - lanternGeo.boundingBox.min.x) || 1;
  const envelopeDepth = (lanternGeo.boundingBox.max.z - lanternGeo.boundingBox.min.z) || 1;
  const envelopeHeight = lanternHeightRange;

  // Per-vertex height + angle factors drive the shader's procedural pattern.
  const vertexCount = lanternGeo.attributes.position.count;
  const heightFactors = new Float32Array(vertexCount);
  const angleFactors = new Float32Array(vertexCount);
  {
    const pa = lanternGeo.attributes.position;
    for (let i = 0; i < vertexCount; i++) {
      const x = pa.getX(i);
      const y = pa.getY(i);
      const z = pa.getZ(i);
      heightFactors[i] = (y - lanternMinY) / lanternHeightRange;
      angleFactors[i] = (Math.atan2(z, x) + Math.PI) / (Math.PI * 2);
    }
  }
  lanternGeo.setAttribute(
    "aHeightFactor",
    new THREE.BufferAttribute(heightFactors, 1)
  );
  lanternGeo.setAttribute(
    "aAngleFactor",
    new THREE.BufferAttribute(angleFactors, 1)
  );

  // Gondola dims are derived from the envelope bounding box.
  const GONDOLA_WIDTH_RATIO = 0.20;
  const GONDOLA_DEPTH_RATIO = 0.20;
  const GONDOLA_HEIGHT_RATIO = 0.12;
  const basketWidth = envelopeWidth * GONDOLA_WIDTH_RATIO;
  const basketDepth = envelopeDepth * GONDOLA_DEPTH_RATIO;
  const basketHeight = envelopeHeight * GONDOLA_HEIGHT_RATIO;

  const basketGeo = new THREE.BoxGeometry(basketWidth, basketHeight, basketDepth);
  const basketMat = new THREE.MeshStandardMaterial({
    color: 0x8b6b46, // wicker brown
    metalness: 0.0,
    roughness: 1.0,
  });
  const gondolaLocalYOffset = lanternMinY - basketHeight * 0.75;

  // ---------------------------------------------------------
  // Balloon material: MeshPhysicalMaterial + custom shader pattern.
  // Each balloon gets its own material clone with unique uniforms
  // (tint / pattern type / seed / buoyancy). Adapted from balloon-simulator.
  // ---------------------------------------------------------
  const REAL_BALLOON_PALETTE = [
    0xd72638, 0xff6f00, 0xf9c80e, 0x2e7d32, 0x1565c0, 0x283593, 0x6a1b9a,
    0x00838f, 0x6d4c41, 0x263238, 0xffffff, 0xe0e0e0, 0x111111,
  ];

  const SHADER_VERTEX_DECL = `
attribute float aHeightFactor;
attribute float aAngleFactor;
varying float vH;
varying float vA;
`;

  const SHADER_VERTEX_BODY = `
#include <begin_vertex>
vH = aHeightFactor;
vA = aAngleFactor;
`;

  const SHADER_FRAGMENT_DECL = `
uniform vec3 uBaseTint;
uniform float uPatternType;
uniform float uSeed;
uniform float uBuoyancy;
uniform vec3 uBrightColor;
uniform vec3 uFlameColor;
uniform float uFlameMix;
uniform float uLitMix;
uniform float uLitBoost;
uniform float uPatDensity;
uniform float uPaperWhiteMix;
uniform float uEmissiveStrength;

varying float vH;
varying float vA;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
vec3 srgbToLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 pickRealPaint(float idx) {
  vec3 c;
  if (idx < 0.5)       c = vec3(0.843, 0.149, 0.220);
  else if (idx < 1.5)  c = vec3(1.000, 0.435, 0.000);
  else if (idx < 2.5)  c = vec3(0.976, 0.784, 0.055);
  else if (idx < 3.5)  c = vec3(0.180, 0.490, 0.196);
  else if (idx < 4.5)  c = vec3(0.082, 0.396, 0.753);
  else if (idx < 5.5)  c = vec3(0.157, 0.208, 0.576);
  else if (idx < 6.5)  c = vec3(0.416, 0.106, 0.604);
  else if (idx < 7.5)  c = vec3(0.000, 0.514, 0.561);
  else if (idx < 8.5)  c = vec3(0.427, 0.298, 0.255);
  else if (idx < 9.5)  c = vec3(0.149, 0.196, 0.220);
  else if (idx < 10.5) c = vec3(0.92);
  else                 c = vec3(0.08);
  return srgbToLinear(c);
}
vec3 paletteColor(float seed, float slot) {
  float r0 = floor(hash11(seed + 11.0) * 12.0);
  float r1 = floor(hash11(seed + 29.0) * 12.0);
  float r2 = floor(hash11(seed + 71.0) * 12.0);
  vec3 c0 = pickRealPaint(r0);
  vec3 c1 = pickRealPaint(r1);
  vec3 c2 = pickRealPaint(r2);
  float grime = (hash11(seed + 101.0) - 0.5) * 0.06;
  c0 = clamp(c0 + grime, 0.0, 1.0);
  c1 = clamp(c1 + grime, 0.0, 1.0);
  c2 = clamp(c2 + grime, 0.0, 1.0);
  if (slot < 0.5) return c0;
  if (slot < 1.5) return c1;
  return c2;
}
vec3 pickPalette(float t, float seed) {
  float slot = (t < 0.333) ? 0.0 : ((t < 0.666) ? 1.0 : 2.0);
  return paletteColor(seed, slot);
}
float patternIndex(float type, float h, float a, float density, float seed) {
  float panels = floor(mix(10.0, 18.0, hash11(seed + 3.1)) * density);
  float ia = floor(a * panels);
  float gore = mod(ia, 3.0) / 2.0;
  if (type < 0.5) {
    return gore;
  } else if (type < 1.5) {
    float band = smoothstep(0.00, 0.22, h) * (1.0 - smoothstep(0.22, 0.30, h));
    float scallop = step(0.5, fract(ia * 0.35 + h * 8.0));
    float alt = mix(gore, 0.0, scallop);
    return mix(gore, alt, band);
  } else {
    float zig = floor((h * 7.0 - a * 7.0) * density);
    return mod(zig, 3.0) / 2.0;
  }
}
`;

  const SHADER_FRAGMENT_BODY = `
float b = clamp(uBuoyancy, 0.0, 1.0);
float t = patternIndex(uPatternType, vH, vA, uPatDensity, uSeed);
vec3 basePat = pickPalette(t, uSeed);
basePat = mix(basePat, vec3(1.0), uPaperWhiteMix);
float belly = smoothstep(0.10, 0.65, vH) * (1.0 - smoothstep(0.65, 0.92, vH));
basePat *= (0.92 + 0.14 * belly);
float grad = b * (1.0 - vH);
basePat = mix(basePat, uFlameColor, uFlameMix * grad);
basePat *= (1.0 + 0.25 * uLitBoost * grad);
basePat = min(basePat, vec3(1.0));
basePat = mix(basePat, uBrightColor, uLitMix * b);
vec4 diffuseColor = vec4(basePat, 1.0);
`;

  function createLanternMaterial() {
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.48,
      clearcoat: 0.45,
      clearcoatRoughness: 0.48,
      side: THREE.FrontSide,
    });

    const u = {
      uBaseTint: { value: new THREE.Color(0xffffff) },
      uPatternType: { value: 0 },
      uSeed: { value: Math.random() * 1000 },
      uBuoyancy: { value: 0 },
      uBrightColor: { value: new THREE.Color(0xffddb0) },
      uFlameColor: { value: new THREE.Color(0xff7a18) },
      uFlameMix: { value: 0.7 },
      uLitMix: { value: 0.14 },
      uLitBoost: { value: 0.22 },
      uPatDensity: { value: 1.05 },
      uPaperWhiteMix: { value: 0.0001 },
      uEmissiveStrength: { value: lanternEmissiveStrength },
    };

    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u);
      shader.vertexShader = SHADER_VERTEX_DECL + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        SHADER_VERTEX_BODY
      );
      shader.fragmentShader = SHADER_FRAGMENT_DECL + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        SHADER_FRAGMENT_BODY
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `
#include <emissivemap_fragment>
float _b = clamp(uBuoyancy, 0.0, 1.0);
vec3 _glowColor = mix(uBrightColor, uFlameColor, 0.55);
float _glow = _b * uEmissiveStrength * (0.35 + 0.65 * (1.0 - vH));
totalEmissiveRadiance += _glowColor * _glow;
`
      );
    };

    mat.userData.uniforms = u;
    return mat;
  }

  // ---------------------------------------------------------
  // Physics & bounds
  // ---------------------------------------------------------
  const gravity = -0.2; // gentle downward pull
  const liftStrength = 1.2; // gentle upward lift when buoyant
  const buoyancyRiseRate = 200.5; // hover-driven buoyancy
  const buoyancyDecayRate = 0.4; // baseline decay when not hovered
  const randomLightRate = 0.08; // chance per second each unlit lantern will light

  const HORIZONTAL_DRAG = 0.949;
  const VERTICAL_DRAG = 0.995;
  const MAX_VERTICAL_SPEED = 4.0;

  // Visible region estimates (updated on resize)
  let yVisibleMin = -2;
  let yVisibleMax = 14;
  let ySpawnTop = yVisibleMax + 4;
  let yOffBottom = yVisibleMin - 4;

  let xVisible = 10;
  let xOff = 14;

  let zVisibleMin = -8;
  let zVisibleMax = 4;

  const viewCenter = new THREE.Vector3(0, camera.position.y, 0);

  function updateVisibleBounds() {
    const { width, height } = getSize();
    const aspect = width / height || 1;
    const dist = camera.position.distanceTo(viewCenter);
    const vHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist;

    yVisibleMin = viewCenter.y - vHalf;
    yVisibleMax = viewCenter.y + vHalf;
    ySpawnTop = yVisibleMax + 4;
    yOffBottom = yVisibleMin - 4;

    const hHalf = vHalf * aspect;
    xVisible = hHalf;
    xOff = xVisible * 1.3;

    zVisibleMin = -8;
    zVisibleMax = 4;
  }

  updateVisibleBounds();

  const lanternCollisionRadius =
    Math.max(envelopeWidth, envelopeHeight) * 0.35;

  // ---------------------------------------------------------
  // Lantern spawn / reset
  // ---------------------------------------------------------
  function resetLantern(lantern, isInitial = false) {
    // For initial spawn: anywhere from slightly below to above the hero
    // For respawn: only from above the view, like a stream of floating lanterns
    const spawnYMin = isInitial ? yOffBottom : yVisibleMax + 2;
    const spawnYMax = ySpawnTop;

    lantern.position.set(
      THREE.MathUtils.randFloatSpread(xVisible * 2.0),
      THREE.MathUtils.randFloat(spawnYMin, spawnYMax),
      THREE.MathUtils.randFloat(zVisibleMin, zVisibleMax)
    );

    lantern.userData.velocity.set(
      THREE.MathUtils.randFloatSpread(0.6),
      THREE.MathUtils.randFloat(-0.9, -0.1),
      THREE.MathUtils.randFloatSpread(0.6)
    );

    lantern.userData.buoyancy = Math.random() * Math.random() * 0.4;
    lantern.userData.hovered = false;
  }

  function spawnLantern(isInitial = false) {
    const mat = createLanternMaterial();

    // Single shared geometry — per-instance variation lives in shader uniforms.
    const lantern = new THREE.Mesh(lanternGeo, mat);
    lantern.castShadow = true;
    lantern.receiveShadow = false;

    // Gondola sits below the envelope.
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.castShadow = true;
    basket.receiveShadow = false;
    basket.position.y = gondolaLocalYOffset;
    lantern.add(basket);

    lantern.userData.velocity = new THREE.Vector3();
    lantern.userData.buoyancy = 0;
    lantern.userData.hovered = false;
    lantern.userData.decayRate =
      buoyancyDecayRate * THREE.MathUtils.randFloat(0.6, 1.6);

    lantern.userData.angularVelocity = new THREE.Vector3(
      0,
      THREE.MathUtils.randFloatSpread(0.6),
      0
    );

    lantern.userData.wobble = {
      ampX: THREE.MathUtils.randFloat(0.4, 1.0),
      ampZ: THREE.MathUtils.randFloat(0.3, 0.8),
      speedX: THREE.MathUtils.randFloat(0.4, 1.0),
      speedZ: THREE.MathUtils.randFloat(0.4, 1.0),
      phaseX: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2,
    };

    lantern.userData.material = mat;

    // Per-balloon shader uniforms: tint slot, pattern branch, seed.
    const u = mat.userData.uniforms;
    const hex =
      REAL_BALLOON_PALETTE[
        (Math.random() * REAL_BALLOON_PALETTE.length) | 0
      ];
    u.uBaseTint.value = new THREE.Color(hex);
    const pr = Math.random();
    u.uPatternType.value = pr < 0.72 ? 0 : pr < 0.92 ? 1 : 2;
    u.uSeed.value = Math.random() * 1000.0;
    u.uBuoyancy.value = 0;

    resetLantern(lantern, isInitial);

    scene.add(lantern);
    lanterns.push(lantern);
  }

  // Adaptive lantern count based on container area (keeps mobile smooth)
  const baseArea = 800 * 400;
  const area = initialSize.width * initialSize.height;
  const density = 210 / baseArea;
  const initialLanterns = Math.max(
    35,
    Math.min(210, Math.floor(area * density))
  );

  for (let i = 0; i < initialLanterns; i++) {
    // true => initial spawn with random vertical placement
    spawnLantern(true);
  }

  // ---------------------------------------------------------
  // Pointer hover detection (throttled)
  // ---------------------------------------------------------
  const pointer = new THREE.Vector2();
  const hoverRadius = 0.3;
  const hoverRadiusSq = hoverRadius * hoverRadius;
  const tmpScreenPos = new THREE.Vector3();

  let lastHoverCheck = 0;
  const HOVER_THROTTLE_MS = 30;

  function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onPointerMove(event) {
    const now = performance.now();
    if (now - lastHoverCheck < HOVER_THROTTLE_MS) return;
    lastHoverCheck = now;

    updatePointer(event);

    for (let i = 0; i < lanterns.length; i++) {
      lanterns[i].userData.hovered = false;
    }

    for (let i = 0; i < lanterns.length; i++) {
      const lantern = lanterns[i];
      tmpScreenPos.copy(lantern.position).project(camera);
      const dx = tmpScreenPos.x - pointer.x;
      const dy = tmpScreenPos.y - pointer.y;
      if (dx * dx + dy * dy < hoverRadiusSq) {
        lantern.userData.hovered = true;
      }
    }
  }

  function onPointerLeave() {
    for (let i = 0; i < lanterns.length; i++) {
      lanterns[i].userData.hovered = false;
    }
  }

  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);

  // ---------------------------------------------------------
  // Resize handling (based on hero container, not whole window)
  // ---------------------------------------------------------
  window.addEventListener("resize", () => {
    const { width, height } = getSize();
    if (!width || !height) return;

    // Update DPR on resize too (optional, but nice)
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (width < 700) dpr = Math.min(dpr, 1.25);
    if (width < 500) dpr = Math.min(dpr, 1.1);
    renderer.setPixelRatio(dpr);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    updateVisibleBounds();
  });

  // ---------------------------------------------------------
  // Spatial-hash collisions (much cheaper than O(n^2))
  // ---------------------------------------------------------
  const CELL_SIZE = lanternCollisionRadius * 2.5;
  const grid = new Map();
  const offsets = [-1, 0, 1];

  function cellKey(cx, cy, cz) {
    // cheap-ish integer hash
    return (cx << 20) ^ (cy << 10) ^ cz;
  }

  function handleLanternCollisions(dt) {
    grid.clear();

    // Build grid
    for (let i = 0; i < lanterns.length; i++) {
      const p = lanterns[i].position;
      const cx = Math.floor(p.x / CELL_SIZE);
      const cy = Math.floor(p.y / CELL_SIZE);
      const cz = Math.floor(p.z / CELL_SIZE);
      const key = cellKey(cx, cy, cz);

      let bucket = grid.get(key);
      if (!bucket) {
        bucket = [];
        grid.set(key, bucket);
      }
      bucket.push(i);
    }

    const minDist = lanternCollisionRadius * 2;
    const minDistSq = minDist * minDist;
    const restitution = 0.3;

    for (let i = 0; i < lanterns.length; i++) {
      const a = lanterns[i];
      const pa = a.position;
      const va = a.userData.velocity;

      const cx = Math.floor(pa.x / CELL_SIZE);
      const cy = Math.floor(pa.y / CELL_SIZE);
      const cz = Math.floor(pa.z / CELL_SIZE);

      for (let oxi = 0; oxi < 3; oxi++) {
        for (let oyi = 0; oyi < 3; oyi++) {
          for (let ozi = 0; ozi < 3; ozi++) {
            const ox = offsets[oxi];
            const oy = offsets[oyi];
            const oz = offsets[ozi];

            const key = cellKey(cx + ox, cy + oy, cz + oz);
            const bucket = grid.get(key);
            if (!bucket) continue;

            for (let bi = 0; bi < bucket.length; bi++) {
              const j = bucket[bi];
              if (j <= i) continue;

              const b = lanterns[j];
              const pb = b.position;
              const vb = b.userData.velocity;

              const dx = pb.x - pa.x;
              const dy = pb.y - pa.y;
              const dz = pb.z - pa.z;

              const distSq = dx * dx + dy * dy + dz * dz;
              if (distSq === 0 || distSq > minDistSq) continue;

              const dist = Math.sqrt(distSq);
              const overlap = minDist - dist;
              if (overlap <= 0) continue;

              const nx = dx / dist;
              const ny = dy / dist;
              const nz = dz / dist;

              const half = overlap * 0.5;
              pa.x -= nx * half;
              pa.y -= ny * half;
              pa.z -= nz * half;

              pb.x += nx * half;
              pb.y += ny * half;
              pb.z += nz * half;

              const rvx = vb.x - va.x;
              const rvy = vb.y - va.y;
              const rvz = vb.z - va.z;
              const velAlongNormal = rvx * nx + rvy * ny + rvz * nz;

              if (velAlongNormal > 0) continue;

              const jImpulse = -(1 + restitution) * velAlongNormal * 0.5;

              const impulseX = jImpulse * nx;
              const impulseY = jImpulse * ny;
              const impulseZ = jImpulse * nz;

              va.x -= impulseX;
              va.y -= impulseY;
              va.z -= impulseZ;

              vb.x += impulseX;
              vb.y += impulseY;
              vb.z += impulseZ;
            }
          }
        }
      }
    }
  }

  // ---------------------------------------------------------
  // Main animation loop
  // ---------------------------------------------------------
  let lastTime = performance.now();

  // Optional: run collisions every other frame to reduce cost further
  let collisionToggle = 0;

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05) || 0.016;
    lastTime = now;

    const time = now * 0.001; // seconds, for wobble

    if (!paused) {
      for (let li = 0; li < lanterns.length; li++) {
        const lantern = lanterns[li];
        const v = lantern.userData.velocity;
        const mat = lantern.userData.material;
        const isHovered = !!lantern.userData.hovered;

        let b = lantern.userData.buoyancy || 0;

        if (isHovered) {
          b += buoyancyRiseRate * dt;
        } else if (b > 0) {
          const decay = lantern.userData.decayRate || buoyancyDecayRate;
          b -= decay * dt;
        }

        if (!isHovered && b <= 0.01 && lantern.position.y < yVisibleMax * 0.8) {
          if (Math.random() < randomLightRate * dt) {
            b = 1.0;
          }
        }

        b = THREE.MathUtils.clamp(b, 0, 1);
        lantern.userData.buoyancy = b;

        const ay = gravity + liftStrength * b;
        v.y += ay * dt;

        // Side-to-side wobble forces
        const wobble = lantern.userData.wobble;
        if (wobble) {
          const wobbleX =
            Math.sin(time * wobble.speedX + wobble.phaseX) * wobble.ampX;
          const wobbleZ =
            Math.cos(time * wobble.speedZ + wobble.phaseZ) * wobble.ampZ;

          v.x += wobbleX * dt;
          v.z += wobbleZ * dt;
        }

        // drag
        v.x *= HORIZONTAL_DRAG;
        v.y *= VERTICAL_DRAG;
        v.z *= HORIZONTAL_DRAG;

        if (v.y > MAX_VERTICAL_SPEED) v.y = MAX_VERTICAL_SPEED;
        else if (v.y < -MAX_VERTICAL_SPEED) v.y = -MAX_VERTICAL_SPEED;

        lantern.position.x += v.x * dt;
        lantern.position.y += v.y * dt;
        lantern.position.z += v.z * dt;

        const angVel = lantern.userData.angularVelocity;
        if (angVel) {
          lantern.rotation.y += angVel.y * dt;
        }

        // recycle only if far above/below or too far left/right
        if (
          lantern.position.y < yOffBottom ||
          lantern.position.y > ySpawnTop ||
          lantern.position.x < -xOff ||
          lantern.position.x > xOff
        ) {
          // respawn from the top band (isInitial = false)
          resetLantern(lantern, false);
        }

        // bounce off depth walls
        if (lantern.position.z < zVisibleMin) {
          lantern.position.z = zVisibleMin;
          v.z = Math.abs(v.z) * 0.6;
        } else if (lantern.position.z > zVisibleMax) {
          lantern.position.z = zVisibleMax;
          v.z = -Math.abs(v.z) * 0.6;
        }

        // Drive shader brightness/flame gradient via per-balloon uBuoyancy.
        const u = mat.userData && mat.userData.uniforms;
        if (u) u.uBuoyancy.value = b;
      }

      // collisions (every other frame for extra perf headroom)
      collisionToggle ^= 1;
      if (collisionToggle === 0) {
        handleLanternCollisions(dt);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// ---------------------------------------------------------
// Simulation registry & bootstrapping
// ---------------------------------------------------------
const SIMULATIONS = {
  lanterns: initLanternSimulation,
};

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector("[data-hero-sim]");
  if (!container) return;

  const simName = container.dataset.sim || "lanterns";
  const simFn = SIMULATIONS[simName];
  if (typeof simFn === "function") {
    simFn(container);
  }
});
