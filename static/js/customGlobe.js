// customGlobe.js
// Ce script crée un globe 3D texturé (Terre) avec des marqueurs de ville,
// gère le drag avec inertie, et applique une rotation de base lorsque l'utilisateur ne drag pas.

(function() {
    let scene, camera, renderer;
    let globeMesh;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    const dampingFactor = 0.95;
    const autoRotateSpeed = 0.001; // Rotation de base quand on ne drag pas
  
    // Pour les marqueurs
    const cityMarkers = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
  
    // Paramètres du globe
    const globeRadius = 2.7;
    const markerRadius = globeRadius + 0.05; // Positionner les markers juste au-dessus de la surface
  
    function initGlobe() {
      const container = document.getElementById('custom-globe-container');
      if (!container) {
        console.warn("custom-globe-container introuvable !");
        return;
      }
      const width = container.clientWidth;
      const height = container.clientHeight;
  
      // Création de la scène
      scene = new THREE.Scene();
  
      // Création de la caméra
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 5); // Ajustement pour voir le globe en entier
  
      // Création du renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputEncoding = THREE.sRGBEncoding;
      container.appendChild(renderer.domElement);
  
      // Lumières
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
  
      // Création du globe (Terre)
      const textureLoader = new THREE.TextureLoader();
      const earthTexture = textureLoader.load('/static/media/earth.jpg');
      const globeMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
      const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
      globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
      globeMesh.position.set(0, 0, 0);
      scene.add(globeMesh);
  
      // Ajout des city markers
      addCityMarker(49.1829, -0.3707, markerRadius, "Caen", "IAE de Caen");
      addCityMarker(46.8065, -6, markerRadius, "Fribourg", "Universität Freiburg");
      addCityMarker(49.7913, -9, markerRadius, "Würzburg", "Universität Würzburg");
      addCityMarker(36.8188, -11, markerRadius, "Carthage", "Université de Carthage");
      addCityMarker(40.4168, 4, markerRadius, "Madrid", "Universidad de Madrid");
      addCityMarker(37.3886, 7, markerRadius, "Seville", "Universidad de Sevilla");
      addCityMarker(49.8153, -5, markerRadius, "Luxembourg", "University of Luxembourg");
      addCityMarker(59.9139, -10, markerRadius, "Oslo", "OsloMet (Storbyuniversitetet)");
      addCityMarker(46.7712, -25, markerRadius, "Cluj-Napoca", "Universitatea Babeș-Bolyai");
      addCityMarker(36.7213, 4, markerRadius, "Almería", "Universidad de Almería");
      addCityMarker(37.6257, 2, markerRadius, "Carthagène", "Universidad de Cartagena");
      addCityMarker(32.7767, 95, markerRadius, "Dallas", "Texas A&M University");
      addCityMarker(44.5236, 89, markerRadius, "Stevens Point", "University of Wisconsin");
      addCityMarker(39.9042, -117, markerRadius, "Beijing", "Beijing L&C University");
      addCityMarker(35.6895, -135, markerRadius, "Tokyo", "Kansai Gaidai University");
      addCityMarker(36.2048, -127, markerRadius, "Incheon", "Incheon National University");
      addCityMarker(13, -101, markerRadius, "Kyoto", "Thammasat University");
      addCityMarker(24.4798, -118, markerRadius, "Xiamen", "Xiamen University");
      addCityMarker(-33.8688, -150, markerRadius, "Sydney", "University of Sydney");
  
      // Événements pour le drag
      container.addEventListener('mousedown', onMouseDown);
      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseup', onMouseUp);
      container.addEventListener('mouseleave', onMouseUp);
  
      // Événement pour le survol des markers
      container.addEventListener('mousemove', onContainerMouseMove);
  
      // Lancement de l'animation
      animate();
  
      // Adaptation responsive
      window.addEventListener('resize', onWindowResize);
    }
  
    // Fonction pour ajouter un marqueur de ville
    function addCityMarker(lat, lon, radius, cityName, textLabel) {
      const cityGeometry = new THREE.IcosahedronGeometry(0.08);
      const baseColor = (cityName === "Caen") ? 0x9b59b6 : 0xc0392b;
      const cityMaterial = new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.0,
        roughness: 0.05,
        transparent: true,
        opacity: 0.8,
      });
      const markerMesh = new THREE.Mesh(cityGeometry, cityMaterial);
  
      const latRad = THREE.MathUtils.degToRad(lat);
      const lonRad = THREE.MathUtils.degToRad(lon);
      const pos = new THREE.Vector3(
        radius * Math.cos(latRad) * Math.cos(lonRad),
        radius * Math.sin(latRad),
        radius * Math.cos(latRad) * Math.sin(lonRad)
      );
      markerMesh.position.copy(pos);
      globeMesh.add(markerMesh);
  
      // Création du label via canvas (sans flèche)
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const context = canvas.getContext('2d');
      drawRoundedLabel(context, textLabel, canvas.width, canvas.height);
  
      const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(canvas),
        transparent: true,
        opacity: 0 // commence invisible
      });
      const labelSprite = new THREE.Sprite(spriteMaterial);
      labelSprite.center.set(0.5, 1);
      labelSprite.renderOrder = 1;
      labelSprite.material.depthTest = false;
      labelSprite.material.depthWrite = false;
      labelSprite.position.copy(pos.clone().add(new THREE.Vector3(0, 0.35, 0.15)));
      labelSprite.scale.set(1.2, 0.3, 1);
      globeMesh.add(labelSprite);
  
      cityMarkers.push({
        mesh: markerMesh,
        label: labelSprite,
        labelMaterial: spriteMaterial,
        currentOpacity: 0,
        targetOpacity: 0,
        baseScale: 1.0,
        scaleAmplitude: 0.2,
        scaleFrequency: 1.5 + Math.random() * 0.5,
        scaleOffset: Math.random() * 10
      });
    }
  
    // Fonction utilitaire pour dessiner un label arrondi (sans flèche)
    function drawRoundedLabel(context, text, width, height) {
      context.clearRect(0, 0, width, height);
      const radius = 8;
      const triangleHeight = 10; // anciennement utilisé pour la flèche
      const rectHeight = height - triangleHeight;
  
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
  
      const gradient = context.createLinearGradient(0, 0, 0, rectHeight);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
  
      context.fillStyle = gradient;
      context.fill();
  
      context.shadowColor = "transparent";
      context.fillStyle = "#ffffff";
      context.font = "bold 14px Helvetica, Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
  
      const textY = rectHeight / 2;
      context.fillText(text, width / 2, textY);
    }
  
    // Gestion du drag avec inertie pour faire tourner le globe
    function onMouseDown(event) {
      isDragging = true;
      previousMousePosition.x = event.clientX;
      previousMousePosition.y = event.clientY;
      // Réinitialiser la vélocité au début du drag
      rotationVelocity.x = 0;
      rotationVelocity.y = 0;
    }
    
    function onMouseMove(event) {
      if (!isDragging) return;
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;
      
      // Appliquer la rotation directement
      globeMesh.rotation.y += deltaX * 0.005;
      globeMesh.rotation.x += deltaY * 0.005;
      globeMesh.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globeMesh.rotation.x));
      
      // Enregistrer la vélocité (pour inertie)
      rotationVelocity.y = deltaX * 0.005;
      rotationVelocity.x = deltaY * 0.005;
      
      previousMousePosition.x = event.clientX;
      previousMousePosition.y = event.clientY;
    }
    
    function onMouseUp() {
      isDragging = false;
      // La vélocité continue d'être appliquée dans la boucle d'animation
    }
    
    // Gestion du survol des markers via raycaster
    function onContainerMouseMove(event) {
      const container = event.currentTarget;
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const markerMeshes = cityMarkers.map(item => item.mesh);
      const intersects = raycaster.intersectObjects(markerMeshes, true);
      cityMarkers.forEach(item => item.targetOpacity = 0);
      if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const marker = cityMarkers.find(item => item.mesh === intersected);
        if (marker) {
          marker.targetOpacity = 1;
        }
      }
    }
    
    // Boucle d'animation avec inertie et rotation de base
    function animate() {
      requestAnimationFrame(animate);
    
      if (!isDragging) {
        // Appliquer la vélocité inertielle et ajouter la rotation de base
        globeMesh.rotation.y += autoRotateSpeed + rotationVelocity.y;
        globeMesh.rotation.x += rotationVelocity.x;
        rotationVelocity.x *= dampingFactor;
        rotationVelocity.y *= dampingFactor;
      }
    
      // Mise à jour des marqueurs : effet de fade et pulsation
      cityMarkers.forEach(marker => {
        const speed = 0.1;
        marker.currentOpacity += (marker.targetOpacity - marker.currentOpacity) * speed;
        marker.labelMaterial.opacity = marker.currentOpacity;
        marker.label.visible = marker.currentOpacity >= 0.01;
        const time = performance.now() * 0.001;
        const scaleFactor = marker.baseScale + marker.scaleAmplitude * Math.sin((time + marker.scaleOffset) * marker.scaleFrequency);
        marker.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      });
    
      renderer.render(scene, camera);
    }
    
    function onWindowResize() {
      const container = document.getElementById('custom-globe-container');
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('DOMContentLoaded', initGlobe);
  })();
  