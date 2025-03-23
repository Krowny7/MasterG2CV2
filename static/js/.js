// Configuration de la scène pour le robot
const robotScene = new THREE.Scene();
const cubeContainer = document.getElementById('cube-container'); // Utiliser cube-container comme conteneur

if (cubeContainer) {
    // Configuration de la caméra
    const robotCamera = new THREE.PerspectiveCamera(
        75,
        cubeContainer.clientWidth / cubeContainer.clientHeight,
        0.1,
        1000
    );
    robotCamera.position.z = 2; // Distance ajustée pour inclure tout le robot

    // Configuration du renderer
    const robotRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        precision: 'highp',
        powerPreference: 'high-performance',
    });
    robotRenderer.setSize(cubeContainer.offsetWidth, cubeContainer.offsetHeight);
    robotRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    robotRenderer.outputEncoding = THREE.sRGBEncoding;
    cubeContainer.appendChild(robotRenderer.domElement);

    

    // Lumières
    const robotLight = new THREE.DirectionalLight(0xffffff, 1.5);
    robotLight.position.set(5, 5, 5);
    robotScene.add(robotLight);

    const robotAmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
    robotScene.add(robotAmbientLight);

    const fillLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    robotScene.add(fillLight);

    const headLight = new THREE.PointLight(0xffffff, 0.8, 10);
    headLight.position.set(0, 1.5, 2);
    robotScene.add(headLight);

    // Décalage général pour centrer le robot verticalement
    const globalVerticalOffset = -0.5;

    // Matériau unique
    const robotMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        reflectivity: 0.5,
    });

    // Corps
    const bodyGeometry = new THREE.SphereGeometry(0.8, 64, 64);
    const body = new THREE.Mesh(bodyGeometry, robotMaterial);
    body.scale.set(0.65, 0.7, 0.65);
    body.position.set(0, 0.1 + globalVerticalOffset, 0); // Décalage ajusté
    robotScene.add(body);

    // Tête
    const headGeometry = new THREE.SphereGeometry(0.7, 64, 64);
    const head = new THREE.Mesh(headGeometry, robotMaterial); // Matériau uniforme
    head.scale.set(1.5, 1, 1.3);
    head.position.set(0, 0.8 + globalVerticalOffset, 0);
    robotScene.add(head);

    // Texture pour le visage
    const textureLoader = new THREE.TextureLoader();
    const faceTexture = textureLoader.load('static/robot_face.png'); // Remplacez par le bon chemin de texture
    const faceGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.64); // Rectangle plat
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
    leftArm.position.set(-0.7, -0.05 + globalVerticalOffset, 0); // Alignement avec le corps
    rightArm.position.set(0.7, -0.05 + globalVerticalOffset, 0);
    robotScene.add(leftArm);
    robotScene.add(rightArm);

    // Oreilles
    const earGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const earMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000, // Noir pur
        metalness: 0.2,
        roughness: 0.4,
    });

    // Oreille gauche
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.scale.set(0.3, 0.55, 0.5); // Échelle de l'oreille
    leftEar.position.set(-0.55, 0.5 + globalVerticalOffset, 0.2); // Alignement avec la tête
    head.add(leftEar);

    // Oreille droite
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.scale.set(0.3, 0.55, 0.5); // Échelle de l'oreille
    rightEar.position.set(0.55, 0.5 + globalVerticalOffset, 0.2); // Alignement avec la tête
    head.add(rightEar);
        
    // Variables pour le suivi de la souris
    let mouseX = 0;
    let mouseY = 0;
    const followIntensity = 0.1; // Intensité du suivi de la souris
    let lastMouseMoveTime = Date.now(); // Dernière activité de la souris
    let randomHeadRotation = { x: 0, y: 0 }; // Rotation aléatoire de la tête
    const randomRotationInterval = 2000; // Temps entre deux rotations aléatoires (en ms)

    // Écouteur d'événement pour la souris
    cubeContainer.addEventListener('mousemove', (event) => {
        const rect = cubeContainer.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        lastMouseMoveTime = Date.now(); // Mise à jour du temps de la dernière activité
    });

    // Fonction pour générer une rotation aléatoire
    function generateRandomRotation() {
        randomHeadRotation.x = (Math.random() - 0.5) * 0.8; // Rotation entre -0.2 et 0.2 rad
        randomHeadRotation.y = (Math.random() - 0.5) * 1; // Rotation entre -0.2 et 0.2 rad
    }

    // Appel initial de la fonction de rotation aléatoire
    generateRandomRotation();

    let floatOffset = 0;

    function animateRobot() {
        requestAnimationFrame(animateRobot);

        const currentTime = Date.now();
        const timeSinceLastMouseMove = currentTime - lastMouseMoveTime;

        // Mouvement de flottaison
        floatOffset += 0.01;
        const verticalPosition = Math.sin(floatOffset) * 0.1;
        body.position.y = 0.1 + verticalPosition + globalVerticalOffset;
        head.position.y = 0.8 + verticalPosition + globalVerticalOffset;

        // Déterminez si la souris est inactive et appliquez des mouvements aléatoires
        if (timeSinceLastMouseMove > 3000) { // Si la souris n'a pas bougé depuis 3 secondes
            if (timeSinceLastMouseMove % randomRotationInterval < 16) {
                generateRandomRotation(); // Change la rotation aléatoire toutes les 2 secondes
            }
            head.rotation.y += (randomHeadRotation.y - head.rotation.y) * 0.02; // Transition douce
            head.rotation.x += (randomHeadRotation.x - head.rotation.x) * 0.02; // Transition douce
        } else {
            // Mouvement de la tête suivant la souris
            head.rotation.y += (mouseX * Math.PI * followIntensity - head.rotation.y) * 0.2; // Rotation horizontale
            head.rotation.x += (mouseY * -Math.PI * followIntensity - head.rotation.x) * 0.2; // Rotation verticale
        }

        robotRenderer.render(robotScene, robotCamera);
    }

    animateRobot();
}
