/* ==========================================================================
   TABLE DES MATIÈRES - globe.js
   ==========================================================================
   I. INITIALISATION & CONFIGURATION
      - Vérification du container et fonction utilitaire (drawRoundedLabel)
      - Création de la scène, de la caméra, du renderer et des lumières
   II. AJOUT DES OBJETS 3D
      - Terre
      - Lune (addMoonMarker)
      - Markers (addCityMarker, addParticlesAroundCity)
      - Champ d'étoiles (Stars)
   III. INTERACTIONS & ANIMATION
      - Survol des markers (fade-in / fade-out)
      - Rotation & Drag de la Terre
      - Fonction d'animation (animate)
   IV. ADAPTATION RESPONSIVE
   ==========================================================================
*/

document.addEventListener('DOMContentLoaded', function() {
    /* --------------------------------------------------------------------------
       I. INITIALISATION & CONFIGURATION
       -------------------------------------------------------------------------- */
    const container = document.getElementById('globe-container');
    if (!container) return;
  
    // Fonction utilitaire : Dessin d'un label arrondi + flèche
    function drawRoundedLabel(context, text, width, height) {
      context.clearRect(0, 0, width, height);
  
      const radius = 8;
      const triangleHeight = 10;         // taille de la flèche
      const rectHeight = height - triangleHeight; // hauteur du rectangle
  
      // Dessin du rectangle arrondi
      context.beginPath();
      context.moveTo(radius, 0);
      context.lineTo(width - radius, 0);
      context.quadraticCurveTo(width, 0, width, radius);
      context.lineTo(width, rectHeight - radius);
      context.quadraticCurveTo(width, rectHeight, width - radius, rectHeight);
      context.lineTo(radius, rectHeight);
      context.quadraticCurveTo(0, rectHeight, 0, rectHeight - radius);
      context.lineTo(0, radius);
      context.quadraticCurveTo(0, 0, radius, 0);
      context.closePath();
  
      // Dessin du triangle en bas, centré
      const triX = width / 2;
      context.moveTo(triX - 8, rectHeight);
      context.lineTo(triX, rectHeight + triangleHeight);
      context.lineTo(triX + 8, rectHeight);
      context.closePath();
  
      // Création d'un dégradé vertical
      const gradient = context.createLinearGradient(0, 0, 0, rectHeight);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  
      // Paramètres d'ombre
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
  
      // Remplissage du label
      context.fillStyle = gradient;
      context.fill();
  
      // Désactivation de l'ombre pour le texte
      context.shadowColor = "transparent";
  
      // Style du texte
      context.fillStyle = "#ffffff";
      context.font = "bold 14px Helvetica, Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
  
      // Placement du texte au centre du rectangle
      const textY = rectHeight / 2;
      context.fillText(text, width / 2, textY);
    }
  
    // Création de la scène, de la caméra et du renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 4;
  
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
  
    // Ajout des lumières
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0x404040));
  
    /* --------------------------------------------------------------------------
       II. AJOUT DES OBJETS 3D
       -------------------------------------------------------------------------- */
    // Création de la Terre
    const earthTexture = new THREE.TextureLoader().load("/static/media/earth.jpg");
    const earthMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
    const earthGeometry = new THREE.SphereGeometry(2, 32, 32);
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.position.set(3, 0, 0);
    earthMesh.rotation.y = -Math.PI / 1.5;
    earthMesh.rotation.x = 0.5;
    scene.add(earthMesh);
  
    // Création de la Lune
    function addMoonMarker() {
      const moonTexture = new THREE.TextureLoader().load("/static/media/moon.jpg");
      const moonGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const moonMaterial = new THREE.MeshPhongMaterial({ map: moonTexture });
      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      moonMesh.position.set(0, 20, 0);
      scene.add(moonMesh);
      return moonMesh;
    }
    const moon = addMoonMarker();
    let orbitAngle = 90;
    const orbitSpeed = -0.002;
    const orbitRadius = new THREE.Vector3().subVectors(moon.position, earthMesh.position).length();
  
    // MARKERS : Ajout des marqueurs pour les villes
    const cityMarkers = [];
  
    function addCityMarker(lat, lon, radius, cityName, textLabel) {
      // Couleur spécifique (violet pour Caen, rouge pour les autres)
      const baseColor = (cityName === "Caen") ? 0x9b59b6 : 0xc0392b;
  
      // Création d'un Icosahedron pour le marker
      const cityGeometry = new THREE.IcosahedronGeometry(0.04);
      const cityMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 1.0,
        transparent: true,
        opacity: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
      });
      const markerMesh = new THREE.Mesh(cityGeometry, cityMaterial);
  
      // Calcul de la position sur la sphère
      const cityPosition = new THREE.Vector3();
      cityPosition.x = radius * Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180);
      cityPosition.y = radius * Math.sin(lat * Math.PI / 180);
      cityPosition.z = radius * Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180);
      markerMesh.position.copy(cityPosition);
      earthMesh.add(markerMesh);
  
      // Ajout de particules autour du marker
      addParticlesAroundCity(cityPosition);
  
      // Création du label pour le marker via un canvas
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const context = canvas.getContext('2d');
      drawRoundedLabel(context, textLabel, canvas.width, canvas.height);
  
      // Création du sprite avec le canvas
      const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(canvas),
        transparent: true,
        opacity: 0 // démarre invisible (pour le fade-in)
      });
      const textSprite = new THREE.Sprite(spriteMaterial);
      textSprite.center.set(0.5, 1); // ancrage en bas-centre
      textSprite.renderOrder = 1;
      textSprite.material.depthTest = false;
      textSprite.material.depthWrite = false;
      textSprite.position.copy(cityPosition.clone().add(new THREE.Vector3(0, 0.35, 0.15)));
      textSprite.scale.set(1.2, 0.3, 1);
      earthMesh.add(textSprite);
  
      // Stockage des informations du marker
      cityMarkers.push({
        mesh: markerMesh,
        label: textSprite,
        labelMaterial: spriteMaterial,
        currentOpacity: 0,
        targetOpacity: 0,
        baseScale: 1.0,
        scaleAmplitude: 0.2,
        scaleFrequency: 1.5 + Math.random() * 0.5,
        scaleOffset: Math.random() * 10
      });
    }
  
    function addParticlesAroundCity(position, minDistance = 2, maxDistance = 15, particleCount = 50) {
      const particleGeometry = new THREE.BufferGeometry();
      const posArray = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (maxDistance - minDistance) + minDistance;
        const z = (Math.random() - 0.5) * dist * 2;
        const distanceXY = Math.sqrt(dist ** 2 - z ** 2);
        posArray[index]     = position.x + Math.cos(angle) * distanceXY;
        posArray[index + 1] = position.y + Math.sin(angle) * distanceXY;
        posArray[index + 2] = position.z + z;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.01,
        transparent: true,
        opacity: 0.8,
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      earthMesh.add(particles);
    }
  
    // Liste des marqueurs (coordonnées, nom, label)
    const radius = 2;
    addCityMarker(49.1829, -0.3707, radius, "Caen", "IAE de Caen");
    addCityMarker(46.8065, -6, radius, "Fribourg", "Universität Freiburg");
    addCityMarker(49.7913, -9, radius, "Würzburg", "Universität Würzburg");
    addCityMarker(36.8188, -11, radius, "Carthage", "Université de Carthage");
    addCityMarker(40.4168, 4, radius, "Madrid", "Universidad de Madrid");
    addCityMarker(37.3886, 7, radius, "Seville", "Universidad de Sevilla");
    addCityMarker(49.8153, -5, radius, "Luxembourg", "University of Luxembourg");
    addCityMarker(59.9139, -10, radius, "Oslo", "OsloMet (Storbyuniversitetet)");
    addCityMarker(46.7712, -25, radius, "Cluj-Napoca", "Universitatea Babeș-Bolyai");
    addCityMarker(36.7213, 4, radius, "Almería", "Universidad de Almería");
    addCityMarker(37.6257, 2, radius, "Carthagène", "Universidad de Cartagena");
    addCityMarker(32.7767, 95, radius, "Dallas", "Texas A&M University");
    addCityMarker(44.5236, 89, radius, "Stevens Point", "University of Wisconsin");
    addCityMarker(39.9042, -117, radius, "Beijing", "Beijing L&C University");
    addCityMarker(35.6895, -135, radius, "Tokyo", "Kansai Gaidai University");
    addCityMarker(36.2048, -127, radius, "Incheon", "Incheon National University");
    addCityMarker(13, -101, radius, "Kyoto", "Thammasat University");
    addCityMarker(24.4798, -118, radius, "Xiamen", "Xiamen University");
    addCityMarker(-33.8688, -150, radius, "Sydney", "University of Sydney");
  
    /* --------------------------------------------------------------------------
       III. INTERACTIONS & ANIMATION
       -------------------------------------------------------------------------- */
    // Survol des markers : fade-in / fade-out
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    container.addEventListener('mousemove', (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
  
      const markerMeshes = cityMarkers.map(item => item.mesh);
      const intersects = raycaster.intersectObjects(markerMeshes, true);
  
      // Par défaut, on cache tous les labels (opacité cible = 0)
      cityMarkers.forEach(item => item.targetOpacity = 0);
  
      // Si un marker est survolé, son opacité cible devient 1
      if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const marker = cityMarkers.find(item => item.mesh === intersected);
        if (marker) {
          marker.targetOpacity = 1;
        }
      }
    });
  
    // Champ d'étoiles
    const starCount = 3000;
    const starSizeMin = 1.0;
    const starSizeMax = 3.0;
    const starPositions = new Float32Array(starCount * 3);
    const starAlphas = new Float32Array(starCount);
    const starFadeDirs = new Float32Array(starCount);
    const starFadeSpeeds = new Float32Array(starCount);
    const starSizes = new Float32Array(starCount);
  
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3]     = THREE.MathUtils.randFloatSpread(400);
      starPositions[i3 + 1] = THREE.MathUtils.randFloatSpread(400);
      starPositions[i3 + 2] = THREE.MathUtils.randFloatSpread(400);
      starAlphas[i]         = Math.random();
      starFadeDirs[i]       = Math.random() > 0.5 ? 1 : -1;
      starFadeSpeeds[i]     = THREE.MathUtils.randFloat(0.002, 0.01);
      starSizes[i]          = THREE.MathUtils.randFloat(starSizeMin, starSizeMax);
    }
  
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('alpha', new THREE.BufferAttribute(starAlphas, 1));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  
    const starMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float alpha;
        attribute float size;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          if (length(coord) > 0.5) discard;
          gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false
    });
  
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  
    // Rotation de la Terre et gestion du drag
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    const dampingFactor = 0.95;
    const autoRotateSpeed = 0.001;
  
    document.addEventListener('mousedown', (event) => {
      mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(earthMesh);
      if (intersects.length > 0) {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    });
  
    document.addEventListener('mousemove', (event) => {
      if (!isDragging) return;
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };
      earthMesh.rotation.y += deltaMove.x * 0.005;
      earthMesh.rotation.x += deltaMove.y * 0.005;
      earthMesh.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, earthMesh.rotation.x));
      rotationVelocity = {
        x: deltaMove.y * 0.005,
        y: deltaMove.x * 0.005,
      };
      previousMousePosition = { x: event.clientX, y: event.clientY };
    });
  
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  
    // Fonction d'animation
    function animate() {
      requestAnimationFrame(animate);
  
      // Lune en orbite autour de la Terre
      orbitAngle += orbitSpeed;
      moon.position.x = earthMesh.position.x + orbitRadius * Math.cos(orbitAngle);
      moon.position.z = earthMesh.position.z + orbitRadius * Math.sin(orbitAngle);
      moon.position.y = earthMesh.position.y;
      moon.rotation.y += 0.01;
  
      // Mise à jour des étoiles (fade)
      const alphas = starGeometry.attributes.alpha.array;
      for (let i = 0; i < starCount; i++) {
        alphas[i] += starFadeDirs[i] * starFadeSpeeds[i];
        if (alphas[i] <= 0) {
          alphas[i] = 0;
          starFadeDirs[i] = 1;
        } else if (alphas[i] >= 1) {
          alphas[i] = 1;
          starFadeDirs[i] = -1;
        }
      }
      starGeometry.attributes.alpha.needsUpdate = true;
  
      // Rotation automatique de la Terre (si non en drag)
      if (!isDragging) {
        earthMesh.rotation.y += autoRotateSpeed + rotationVelocity.y;
        earthMesh.rotation.x += rotationVelocity.x;
        rotationVelocity.x *= dampingFactor;
        rotationVelocity.y *= dampingFactor;
      }
  
      // Mise à jour des labels des markers (fade-in / fade-out)
      cityMarkers.forEach(m => {
        const speed = 0.1;
        m.currentOpacity += (m.targetOpacity - m.currentOpacity) * speed;
        m.labelMaterial.opacity = m.currentOpacity;
        m.label.visible = m.currentOpacity >= 0.01;
      });
  
      // Battement (scale) des markers
      const time = performance.now() * 0.001;
      cityMarkers.forEach(m => {
        const scaleFactor = m.baseScale + m.scaleAmplitude * Math.sin((time + m.scaleOffset) * m.scaleFrequency);
        m.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      });
  
      renderer.render(scene, camera);
    }
    animate();
  
    /* --------------------------------------------------------------------------
       IV. ADAPTATION RESPONSIVE
       -------------------------------------------------------------------------- */
    window.addEventListener('resize', () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
  });
  