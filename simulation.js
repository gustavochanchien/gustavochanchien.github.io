// simulation.js
import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { RoundedBoxGeometry } from "https://unpkg.com/three@0.165.0/examples/jsm/geometries/RoundedBoxGeometry.js?module";

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

  // Keep output sane (defaults are fine, but set explicitly)
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

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
  // Lights
  // ---------------------------------------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(6, 12, 8);
  dirLight.castShadow = true;

  // Cheaper shadows (1024 -> 512)
  dirLight.shadow.mapSize.set(512, 512);
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  scene.add(dirLight);

  // ---------------------------------------------------------
  // Geometry: rounded lantern body + small basket
  // ---------------------------------------------------------
  const lanternWidth = 0.6;
  const lanternDepth = 0.6;
  const lanternHeight = 1.0;
  const cornerRadius = 0.3;

  // Reducing smoothness reduces vertexCount a LOT (big perf win)
  const smoothness = 3;

  const baseRoundedGeo = new RoundedBoxGeometry(
    lanternWidth,
    lanternHeight,
    lanternDepth,
    smoothness,
    cornerRadius
  );

  // flare top so it's slightly wider than the bottom
  const flareFactor = 1.3;
  const basePosAttr = baseRoundedGeo.attributes.position;
  for (let i = 0; i < basePosAttr.count; i++) {
    const y = basePosAttr.getY(i);
    if (y > 0) {
      const x = basePosAttr.getX(i);
      const z = basePosAttr.getZ(i);
      basePosAttr.setX(i, x * flareFactor);
      basePosAttr.setZ(i, z * flareFactor);
    }
  }
  basePosAttr.needsUpdate = true;
  baseRoundedGeo.computeVertexNormals();

  const lanternGeo = baseRoundedGeo;

  // Precompute per-vertex height and angle factors (for patterns)
  lanternGeo.computeBoundingBox();
  const lanternMinY = lanternGeo.boundingBox.min.y;
  const lanternMaxY = lanternGeo.boundingBox.max.y;
  const lanternHeightRange = lanternMaxY - lanternMinY;
  const vertexCount = lanternGeo.attributes.position.count;

  const heightFactors = new Float32Array(vertexCount);
  const angleFactors = new Float32Array(vertexCount);
  const posAttrForFactors = lanternGeo.attributes.position;

  for (let i = 0; i < vertexCount; i++) {
    const x = posAttrForFactors.getX(i);
    const y = posAttrForFactors.getY(i);
    const z = posAttrForFactors.getZ(i);

    heightFactors[i] = (y - lanternMinY) / lanternHeightRange; // 0 bottom, 1 top

    const angle = Math.atan2(z, x); // -PI..PI
    angleFactors[i] = (angle + Math.PI) / (Math.PI * 2); // 0..1
  }

  // Basket: small box under each lantern
  const basketWidth = lanternWidth * 0.35;
  const basketDepth = lanternDepth * 0.35;
  const basketHeight = lanternHeight * 0.18;

  const basketGeo = new THREE.BoxGeometry(
    basketWidth,
    basketHeight,
    basketDepth
  );
  const basketMat = new THREE.MeshStandardMaterial({
    color: 0xd6b48a, // light brown-cream
    metalness: 0.25,
    roughness: 0.9,
  });

  // ---------------------------------------------------------
  // Color & pattern utilities
  // ---------------------------------------------------------
  const orangeColorHex = 0xe2a112; // warm peachy orange for emissive
  const tempColor = new THREE.Color();
  const tempHSL = { h: 0, s: 0, l: 0 };

  const patternTypes = ["checker", "horizontal", "diagonal"];

  function createPaletteFromBase(baseColor) {
    const c1 = baseColor.clone();
    const c2 = baseColor.clone().offsetHSL(0.05, 0.08, 0.1);
    const c3 = baseColor.clone().offsetHSL(-0.05, -0.05, -0.08);
    return [c1, c2, c3];
  }

  function applyPatternColor(pattern, vertexIndex, outColor) {
    if (!pattern || !pattern.palette || pattern.palette.length === 0) {
      outColor.set(0xffffff);
      return;
    }

    const h = heightFactors[vertexIndex];
    const a = angleFactors[vertexIndex];
    const palette = pattern.palette;
    const len = palette.length;

    switch (pattern.type) {
      case "checker": {
        const cellsY = pattern.cellsY || 6;
        const cellsA = pattern.cellsA || 6;
        const iy = Math.floor(h * cellsY);
        const ia = Math.floor(a * cellsA);
        const idx = (iy + ia) % len;
        outColor.copy(palette[(idx + len) % len]);
        break;
      }
      case "horizontal": {
        const stripes = pattern.stripes || 7;
        const idx = Math.floor(h * stripes) % len;
        outColor.copy(palette[(idx + len) % len]);
        break;
      }
      case "diagonal":
      default: {
        const stripes = pattern.stripes || 9;
        const v = (h + a) * stripes;
        const idx = Math.floor(v) % len;
        outColor.copy(palette[(idx + len) % len]);
        break;
      }
    }
  }

  function createLanternMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      metalness: 0.0,
      roughness: 0.9,
      transparent: true,
      opacity: 0.9,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      side: THREE.DoubleSide,
    });
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

  // Update vertex colors only when brightness step changes
  const BRIGHTNESS_STEPS = 24;

  const lanterns = [];

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
    Math.max(lanternWidth * flareFactor, lanternHeight) * 0.35;

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

    // force a color refresh when respawned
    lantern.userData.lastBrightStep = -1;
  }

  function spawnLantern(isInitial = false) {
    const mat = createLanternMaterial();

    // Per-lantern geometry because color attribute is unique per lantern
    const geo = lanternGeo.clone();

    // Create and attach per-lantern color attribute
    const colors = new Float32Array(vertexCount * 3);
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const lantern = new THREE.Mesh(geo, mat);
    lantern.castShadow = true;
    lantern.receiveShadow = false;

    // basket
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.castShadow = true;
    basket.receiveShadow = false;
    basket.position.y = lanternMinY - basketHeight * 0.7;
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

    // Per-lantern wobble parameters (side-to-side drift)
    lantern.userData.wobble = {
      ampX: THREE.MathUtils.randFloat(0.4, 1.0), // X swing amplitude
      ampZ: THREE.MathUtils.randFloat(0.3, 0.8), // Z swing amplitude
      speedX: THREE.MathUtils.randFloat(0.4, 1.0), // X wobble speed
      speedZ: THREE.MathUtils.randFloat(0.4, 1.0), // Z wobble speed
      phaseX: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2,
    };

    // per-lantern pattern / palette with darker, more saturated base
    const offColor = new THREE.Color();
    offColor.setHSL(
      Math.random(), // random hue
      0.95 + Math.random() * 0.05, // saturation 0.95–1.0
      0.35 + Math.random() * 0.08 // lightness 0.35–0.43 (darker)
    );
    lantern.userData.offColor = offColor;

    const palette = createPaletteFromBase(offColor);
    const patternType =
      patternTypes[Math.floor(Math.random() * patternTypes.length)];
    lantern.userData.pattern = {
      type: patternType,
      palette,
      stripes: 8,
      cellsY: 6,
      cellsA: 8,
    };

    lantern.userData.material = mat;

    // Precompute base (unlit) vertex colors ONCE for this lantern (big perf win)
    const baseColors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      applyPatternColor(lantern.userData.pattern, i, tempColor);
      const idx = i * 3;
      baseColors[idx] = tempColor.r;
      baseColors[idx + 1] = tempColor.g;
      baseColors[idx + 2] = tempColor.b;
    }
    lantern.userData.baseColors = baseColors;

    // Track last applied brightness step (to avoid per-frame vertex writes)
    lantern.userData.lastBrightStep = -1;

    // pass isInitial flag so first spawn can use full random Y, respawns use top-only
    resetLantern(lantern, isInitial);

    // Fill initial color attribute immediately (step will get applied in animate too)
    // This ensures the lantern starts with correct pattern even before first animate.
    {
      const colorAttr = geo.attributes.color;
      const colorArray = colorAttr.array;
      for (let i = 0; i < baseColors.length; i++) colorArray[i] = baseColors[i];
      colorAttr.needsUpdate = true;
    }

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

        // -----------------------------------------------------
        // Vertex color update: ONLY when brightness step changes
        // -----------------------------------------------------
        const brightStep = (b * BRIGHTNESS_STEPS) | 0;
        if (brightStep !== lantern.userData.lastBrightStep) {
          lantern.userData.lastBrightStep = brightStep;

          const geom = lantern.geometry;
          const colorAttr = geom.attributes.color;
          const colorArray = colorAttr.array;
          const base = lantern.userData.baseColors;

          const qb = brightStep / BRIGHTNESS_STEPS;

          for (let i = 0; i < vertexCount; i++) {
            const idx = i * 3;

            // start from precomputed base pattern color
            tempColor.setRGB(base[idx], base[idx + 1], base[idx + 2]);

            if (qb > 0) {
              // keep hue; brighten based on buoyancy + height gradient
              tempColor.getHSL(tempHSL);

              const h = heightFactors[i]; // 0 bottom, 1 top
              const grad = qb * (1.0 - h); // brighter near bottom
              const extraLight = 0.35 * grad;

              tempHSL.l = Math.min(1, tempHSL.l + extraLight);
              tempColor.setHSL(tempHSL.h, tempHSL.s, tempHSL.l);
            }

            colorArray[idx] = tempColor.r;
            colorArray[idx + 1] = tempColor.g;
            colorArray[idx + 2] = tempColor.b;
          }

          colorAttr.needsUpdate = true;
        }

        // emissive (cheap, per-lantern)
        const baseEmissive = 0.1;
        mat.emissive.setHex(orangeColorHex);
        mat.emissiveIntensity = baseEmissive + 1.0 * b;
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
