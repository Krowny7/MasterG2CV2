// robot3d.js
// Ce script crée un robot 3D en code pur Three.js et le rend dans le conteneur #robot-container.
// Il gère également un léger mouvement de flottaison et un suivi de la souris (ou rotation aléatoire si la souris est inactive).

(function() {
    let scene, camera, renderer;
    let body, head;
    let mouseX = 0, mouseY = 0;
    let lastMouseMoveTime = Date.now();
    let randomHeadRotation = { x: 0, y: 0 };
    const randomRotationInterval = 2000; // toutes les 2 secondes, rotation aléatoire
    const followIntensity = 0.1; // intensité du suivi de la souris
    const globalVerticalOffset = 0.5; // décale le robot vers le bas
    let floatOffset = 0;
  
    function initRobot() {
      const container = document.getElementById('robot-container');
      if (!container) {
        console.warn("robot-container introuvable !");
        return;
      }
  
      const width = container.clientWidth;
      const height = container.clientHeight;
  
      // Création de la scène
      scene = new THREE.Scene();
  
      // Création de la caméra
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 1, 2); // La caméra est positionnée pour voir le robot
  
      // Création du renderer
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        precision: 'highp',
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputEncoding = THREE.sRGBEncoding;
      container.appendChild(renderer.domElement);
  
      // Lumières
      const robotLight = new THREE.DirectionalLight(0xffffff, 1.5);
      robotLight.position.set(5, 5, 5);
      scene.add(robotLight);
  
      const robotAmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(robotAmbientLight);
  
      const fillLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
      scene.add(fillLight);
  
      const headLight = new THREE.PointLight(0xffffff, 0.8, 10);
      headLight.position.set(0, 1.5, 2);
      scene.add(headLight);
  
      // Matériau principal pour le robot
      const robotMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        reflectivity: 0.5,
      });
  
      // Corps du robot
      const bodyGeometry = new THREE.SphereGeometry(0.8, 64, 64);
      body = new THREE.Mesh(bodyGeometry, robotMaterial);
      body.scale.set(0.65, 0.7, 0.65);
      body.position.set(0, 0.1 + globalVerticalOffset, 0);
      scene.add(body);
  
      // Tête du robot
      const headGeometry = new THREE.SphereGeometry(0.7, 64, 64);
      head = new THREE.Mesh(headGeometry, robotMaterial);
      head.scale.set(1.5, 1, 1.3);
      head.position.set(0, 0.8 + globalVerticalOffset, 0);
      scene.add(head);
  
      // Texture pour le visage
      const textureLoader = new THREE.TextureLoader();
      const faceTexture = textureLoader.load('/static/robot_face.png'); // Assurez-vous que le chemin est correct
      const faceGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.64);
      const faceMaterial = new THREE.MeshStandardMaterial({
        map: faceTexture,
        transparent: true,
        metalness: 0.2,
        roughness: 0.4,
      });
      const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
      faceMesh.position.set(0, -0.05, 0.38);
      head.add(faceMesh);
  
      // Bras
      const armGeometry = new THREE.SphereGeometry(0.3, 32, 32);
      const leftArm = new THREE.Mesh(armGeometry, robotMaterial);
      const rightArm = new THREE.Mesh(armGeometry, robotMaterial);
      leftArm.scale.set(0.5, 1, 0.5);
      rightArm.scale.set(0.5, 1, 0.5);
      leftArm.position.set(-0.7, -0.05 + globalVerticalOffset, 0);
      rightArm.position.set(0.7, -0.05 + globalVerticalOffset, 0);
      scene.add(leftArm);
      scene.add(rightArm);
  
      // Oreilles
      const earGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const earMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.2,
        roughness: 0.4,
      });
      const leftEar = new THREE.Mesh(earGeometry, earMaterial);
      leftEar.scale.set(0.3, 0.55, 0.5);
      leftEar.position.set(-0.55, -0.5 + globalVerticalOffset, 0.2);
      head.add(leftEar);
      const rightEar = new THREE.Mesh(earGeometry, earMaterial);
      rightEar.scale.set(0.3, 0.55, 0.5);
      rightEar.position.set(0.55, -0.5 + globalVerticalOffset, 0.2);
      head.add(rightEar);
  
      // Gestion du suivi de la souris
      container.addEventListener('mousemove', onMouseMove);
  
      // Initialisation de la rotation aléatoire
      generateRandomRotation();
  
      // Lancer l'animation du robot
      animateRobot();
    }
  
    function onMouseMove(event) {
      const container = event.currentTarget;
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      lastMouseMoveTime = Date.now();
    }
  
    function generateRandomRotation() {
      randomHeadRotation.x = (Math.random() - 0.5) * 0.8;
      randomHeadRotation.y = (Math.random() - 0.5) * 1;
    }
  
    function animateRobot() {
      requestAnimationFrame(animateRobot);
  
      const currentTime = Date.now();
      const timeSinceLastMouseMove = currentTime - lastMouseMoveTime;
  
      // Flottaison
      floatOffset += 0.01;
      const verticalPosition = Math.sin(floatOffset) * 0.1;
      if (body) body.position.y = 0.1 + verticalPosition + globalVerticalOffset;
      if (head) head.position.y = 0.8 + verticalPosition + globalVerticalOffset;
  
      // Rotation de la tête
      if (head) {
        if (timeSinceLastMouseMove > 3000) {
          if (timeSinceLastMouseMove % randomRotationInterval < 16) {
            generateRandomRotation();
          }
          head.rotation.y += (randomHeadRotation.y - head.rotation.y) * 0.02;
          head.rotation.x += (randomHeadRotation.x - head.rotation.x) * 0.02;
        } else {
          head.rotation.y += (mouseX * Math.PI * followIntensity - head.rotation.y) * 0.2;
          head.rotation.x += (mouseY * -Math.PI * followIntensity - head.rotation.x) * 0.2;
        }
      }
  
      renderer.render(scene, camera);
    }
  
    window.addEventListener('DOMContentLoaded', initRobot);
  })();
  