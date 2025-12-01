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

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(initialSize.width, initialSize.height);
  renderer.shadowMap.enabled = true;
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
  dirLight.shadow.mapSize.set(1024, 1024);
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
  const smoothness = 5;

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
  const brightColorHex = 0xfff6a0; // soft bright pastel yellow when lit
  const orangeColorHex = 0xc4c47a; // warm peachy orange for mix / emissive
  const brightColor = new THREE.Color(brightColorHex);
  const orangeColor = new THREE.Color(orangeColorHex);
  const litMixColor = brightColor.clone().lerp(orangeColor, 0.5);
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
  }

  function spawnLantern(isInitial = false) {
    const mat = createLanternMaterial();

    const geo = lanternGeo.clone();
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
      ampX: THREE.MathUtils.randFloat(0.4, 1.0),   // X swing amplitude
      ampZ: THREE.MathUtils.randFloat(0.3, 0.8),   // Z swing amplitude
      speedX: THREE.MathUtils.randFloat(0.4, 1.0), // X wobble speed
      speedZ: THREE.MathUtils.randFloat(0.4, 1.0), // Z wobble speed
      phaseX: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2,
    };

    // per-lantern pattern / palette with darker, more saturated base
    const offColor = new THREE.Color();
    offColor.setHSL(
      Math.random(),                 // random hue
      0.95 + Math.random() * 0.05,   // saturation 0.95–1.0
      0.35 + Math.random() * 0.08    // lightness 0.35–0.43 (darker)
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

    // pass isInitial flag so first spawn can use full random Y, respawns use top-only
    resetLantern(lantern, isInitial);

    scene.add(lantern);
    lanterns.push(lantern);
  }

  const initialLanterns = 110;
  for (let i = 0; i < initialLanterns; i++) {
    // true => initial spawn with random vertical placement
    spawnLantern(true);
  }

  // ---------------------------------------------------------
  // Pointer hover detection
  // ---------------------------------------------------------
  const pointer = new THREE.Vector2();
  const hoverRadius = 0.3;
  const hoverRadiusSq = hoverRadius * hoverRadius;
  const tmpScreenPos = new THREE.Vector3();

  function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onPointerMove(event) {
    updatePointer(event);

    for (const lantern of lanterns) {
      lantern.userData.hovered = false;
    }

    for (const lantern of lanterns) {
      tmpScreenPos.copy(lantern.position).project(camera);
      const dx = tmpScreenPos.x - pointer.x;
      const dy = tmpScreenPos.y - pointer.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < hoverRadiusSq) {
        lantern.userData.hovered = true;
      }
    }
  }

  function onPointerLeave() {
    for (const lantern of lanterns) {
      lantern.userData.hovered = false;
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

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    updateVisibleBounds();
  });

  // ---------------------------------------------------------
  // Simple sphere-based collisions between lanterns
  // ---------------------------------------------------------
  function handleLanternCollisions(dt) {
    const minDist = lanternCollisionRadius * 2;
    const minDistSq = minDist * minDist;
    const restitution = 0.3;

    for (let i = 0; i < lanterns.length; i++) {
      const a = lanterns[i];
      const pa = a.position;
      const va = a.userData.velocity;

      for (let j = i + 1; j < lanterns.length; j++) {
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

        const halfCorrection = overlap * 0.5;
        pa.x -= nx * halfCorrection;
        pa.y -= ny * halfCorrection;
        pa.z -= nz * halfCorrection;

        pb.x += nx * halfCorrection;
        pb.y += ny * halfCorrection;
        pb.z += nz * halfCorrection;

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

  // ---------------------------------------------------------
  // Main animation loop
  // ---------------------------------------------------------
  let lastTime = performance.now();

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05) || 0.016;
    lastTime = now;

    const time = now * 0.001; // seconds, for wobble

    if (!paused) {
      for (const lantern of lanterns) {
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

        // per-vertex color update (pattern + lit gradient)
        const geom = lantern.geometry;
        const colorAttr = geom.attributes.color;
        const colorArray = colorAttr.array;
        const pattern = lantern.userData.pattern;

        for (let i = 0; i < vertexCount; i++) {
        applyPatternColor(pattern, i, tempColor);

        if (b > 0) {
            // instead of lerping to a warm global color,
            // keep the hue and just brighten based on buoyancy and height
            tempColor.getHSL(tempHSL);

            const h = heightFactors[i];       // 0 bottom, 1 top
            const grad = b * (1.0 - h);       // brighter near the bottom
            const extraLight = 0.35 * grad;   // tweak 0.35 up/down for more/less glow

            tempHSL.l = Math.min(1, tempHSL.l + extraLight);
            tempColor.setHSL(tempHSL.h, tempHSL.s, tempHSL.l);
        }

        const idx = i * 3;
        colorArray[idx] = tempColor.r;
        colorArray[idx + 1] = tempColor.g;
        colorArray[idx + 2] = tempColor.b;
        }
        colorAttr.needsUpdate = true;

        const baseEmissive = 0.3;
        mat.emissive.setHex(orangeColorHex);
        //mat.emissive.copy(lantern.userData.offColor);      // use the lantern’s hue
        mat.emissiveIntensity = baseEmissive + 1.0 * b;

      }

      handleLanternCollisions(dt);
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
