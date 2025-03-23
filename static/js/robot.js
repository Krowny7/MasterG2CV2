/* ==========================================================================
   TABLE DES MATIÈRES - robot.js
   ==========================================================================
   I. INITIALISATION & TEXTURES
      1. Création de l'atlas de texture pour les chiffres
      2. Scène, Renderer (transparent) et Caméra
      3. Lumières
   II. CRÉATION DU NUAGE DE PARTICULES ET DES ATTRIBUTS
      4. Création du nuage de particules et initialisation des attributs
      5. Matériau shader pour les particules
   III. GÉNÉRATION DES FORMES & INTERACTIONS
      6. Échantillonnage pour créer différentes formes
      7. Création et subdivision des formes (shapes)
      8. Rotation manuelle (drag & drop) + inertie
      9. Changement de forme au clic
   IV. ANIMATION & REDIMENSIONNEMENT
      10. Animation : rotation auto, inertie et transitions
      11. Redimensionnement de la scène
   ==========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cube-container');
  if (!container) return;

  /* --------------------------------------------------------------------------
     I. INITIALISATION & TEXTURES
     -------------------------------------------------------------------------- */
  // 1. Création de l'atlas de texture pour les chiffres
  const createDigitsAtlas = () => {
    const cellSize = 128;
    const cols = 10; // chiffres de 0 à 9
    const canvas = document.createElement('canvas');
    canvas.width = cellSize * cols;
    canvas.height = cellSize;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < cols; i++) {
      const digit = i.toString();
      const x = cellSize * i + cellSize / 2;
      const y = cellSize / 2;
      ctx.fillText(digit, x, y);
    }
    return new THREE.Texture(canvas);
  };
  const digitsAtlas = createDigitsAtlas();
  digitsAtlas.needsUpdate = true;

  // 2. Scène, Renderer (transparent) et Caméra
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0); // fond transparent
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.z = 4;

  // 3. Lumières
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(2, 2, 5);
  scene.add(dirLight);

  /* --------------------------------------------------------------------------
     II. CRÉATION DU NUAGE DE PARTICULES ET DES ATTRIBUTS
     -------------------------------------------------------------------------- */
  const PARTICLE_COUNT = 3000;
  const TRANSITION_TIME = 1.0; // secondes pour la transition
  const STAY_TIME = 3.0;       // secondes d'attente sur chaque forme
  const shapes = [];
  let currentShapeIndex = 0;
  let nextShapeIndex = 1;
  let transitionStartTime = 0;
  let transitioning = false;
  let startPositions = null; // positions de départ de la transition

  // Positions initiales aléatoires
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 5;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Attribut "aDigitIndex" : chiffre aléatoire par particule
  const digitIndices = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    digitIndices[i] = Math.floor(Math.random() * 10);
  }
  geometry.setAttribute('aDigitIndex', new THREE.BufferAttribute(digitIndices, 1));

  // 5. Matériau shader pour les particules (flip vertical)
  const vertexShader = `
    attribute float aDigitIndex;
    varying float vDigitIndex;
    void main() {
      vDigitIndex = aDigitIndex;
      gl_PointSize = 20.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
    uniform sampler2D uTexture;
    varying float vDigitIndex;
    void main() {
      float cellWidth = 1.0 / 10.0;
      vec2 uv = gl_PointCoord;
      uv.y = 1.0 - uv.y;
      float index = floor(vDigitIndex + 0.5);
      uv.x = uv.x * cellWidth + index * cellWidth;
      vec4 color = texture2D(uTexture, uv);
      if (color.a < 0.1) discard;
      gl_FragColor = color;
    }
  `;
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: { uTexture: { value: digitsAtlas } },
    vertexShader,
    fragmentShader,
    transparent: true
  });
  const pointCloud = new THREE.Points(geometry, shaderMaterial);
  scene.add(pointCloud);
  const baseScale = 1;
  pointCloud.scale.set(baseScale, baseScale, baseScale);

  /* --------------------------------------------------------------------------
     III. GÉNÉRATION DES FORMES & INTERACTIONS
     -------------------------------------------------------------------------- */
  // 6. Échantillonnage pour créer différentes formes
  const sampleGeometryVertices = (geo, count) => {
    const posAttr = geo.getAttribute('position');
    const vertexCount = posAttr.count;
    const samplePositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const randIndex = Math.floor(Math.random() * vertexCount);
      samplePositions[i * 3 + 0] = posAttr.getX(randIndex);
      samplePositions[i * 3 + 1] = posAttr.getY(randIndex);
      samplePositions[i * 3 + 2] = posAttr.getZ(randIndex);
    }
    return samplePositions;
  };

  // 7. Création et subdivision des formes
  const boxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5, 20, 20, 20);
  const sphereGeo = new THREE.SphereGeometry(1.0, 64, 64);
  const torusGeo = new THREE.TorusGeometry(0.8, 0.2, 64, 128);
  const torusKnotGeo = new THREE.TorusKnotGeometry(0.8, 0.2, 200, 32);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 2, 64, 16);
  const icosaGeo = new THREE.IcosahedronGeometry(1, 4);
  const planeGeo = new THREE.PlaneGeometry(3, 3, 64, 64);
  shapes.push(sampleGeometryVertices(boxGeo, PARTICLE_COUNT));
  shapes.push(sampleGeometryVertices(sphereGeo, PARTICLE_COUNT));
  shapes.push(sampleGeometryVertices(torusGeo, PARTICLE_COUNT));
  shapes.push(sampleGeometryVertices(torusKnotGeo, PARTICLE_COUNT));
  shapes.push(sampleGeometryVertices(cylinderGeo, PARTICLE_COUNT));
  shapes.push(sampleGeometryVertices(icosaGeo, PARTICLE_COUNT));
  shapes.push(sampleGeometryVertices(planeGeo, PARTICLE_COUNT));

  // 8. Rotation manuelle (drag & drop) + inertie
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotationVelocity = { x: 0, y: 0 };

  const onMouseDown = (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  };
  const onMouseMove = (event) => {
    if (!isDragging) return;
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;
    pointCloud.rotation.y += deltaX * 0.01;
    pointCloud.rotation.x += deltaY * 0.01;
    rotationVelocity = { x: deltaX * 0.02, y: deltaY * 0.02 };
    previousMousePosition = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  };
  const onMouseUp = () => isDragging = false;
  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);
  renderer.domElement.addEventListener('mouseleave', onMouseUp);

  // 9. Changement de forme au clic
  renderer.domElement.addEventListener('click', () => {
    if (!transitioning) {
      startPositions = new Float32Array(geometry.attributes.position.array);
      nextShapeIndex = (currentShapeIndex + 1) % shapes.length;
      transitioning = true;
      transitionStartTime = performance.now();
    }
  });

  /* --------------------------------------------------------------------------
     IV. ANIMATION & REDIMENSIONNEMENT
     -------------------------------------------------------------------------- */
  let lastShapeChangeTime = performance.now();
  let lastFrameTime = performance.now();
  const animate = (time) => {
    requestAnimationFrame(animate);
    const dt = (time - lastFrameTime) / 1000;
    lastFrameTime = time;
    const dtShape = (time - lastShapeChangeTime) / 1000;
    pointCloud.rotation.y += 0.002;
    if (!isDragging) {
      pointCloud.rotation.y += rotationVelocity.x * dt;
      pointCloud.rotation.x += rotationVelocity.y * dt;
      rotationVelocity.x *= 0.95;
      rotationVelocity.y *= 0.95;
    }
    const posArray = geometry.attributes.position.array;
    if (transitioning) {
      const elapsed = (time - transitionStartTime) / 1000;
      const t = Math.min(elapsed / TRANSITION_TIME, 1);
      const targetPositions = shapes[nextShapeIndex];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        posArray[i3 + 0] = startPositions[i3 + 0] * (1 - t) + targetPositions[i3 + 0] * t;
        posArray[i3 + 1] = startPositions[i3 + 1] * (1 - t) + targetPositions[i3 + 1] * t;
        posArray[i3 + 2] = startPositions[i3 + 2] * (1 - t) + targetPositions[i3 + 2] * t;
      }
      geometry.attributes.position.needsUpdate = true;
      if (t >= 1) {
        transitioning = false;
        currentShapeIndex = nextShapeIndex;
        lastShapeChangeTime = performance.now();
      }
    } else if (dtShape > STAY_TIME) {
      startPositions = new Float32Array(geometry.attributes.position.array);
      nextShapeIndex = (currentShapeIndex + 1) % shapes.length;
      transitioning = true;
      transitionStartTime = time;
    }
    const heartbeat = 1 + 0.1 * Math.sin((time / 1000) * (2 * Math.PI / 8));
    pointCloud.scale.set(baseScale * heartbeat, baseScale * heartbeat, baseScale * heartbeat);
    renderer.render(scene, camera);
  };
  animate(performance.now());

  // 11. Redimensionnement
  const onResize = () => {
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 300;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();
});
