document.addEventListener('DOMContentLoaded', function() {

  // -- 1. Configuration des slides --
  const slidesData = [
    {
      type: 'image',
      src: '/static/media/img1.jpg',
      alt: 'Image 1',
      captionHtml: `
        <div class="slide-inner-html-nobg centered first-slide-content" style="color: #fff;">
          <div class="reduce-gap text-outline" style="font-size: 1.5rem; font-weight: 700">
            – IAE CAEN –
          </div>
          <h2 class="text-outline" style="font-size: 3rem; margin-bottom: 2rem;">
            Master Gestion d'actif, Contrôle des Risques, Conformité
          </h2>
          <div class="text-outline" style="font-size: 1.2rem; margin-bottom: 2rem; font-weight: 700">
            2ème meilleur master 2024
            <a href="https://www.eduniversal-ranking.com/" target="_blank" class="logo-eduniversal">
              <img src="/static/media/logo-eduniversal.png" alt="Eduniversal" style="vertical-align: middle;">
            </a>
          </div>
          <a href="#" class="button-standard">Candidater</a>
        </div>
      `
    },
    // -- 2ᵉ slide : Globe 3D --
    {
      type: '3d',
      containerId: 'globe-container',
      alt: 'Globe 3D',
      captionHtml: `
        <div class="slide-inner-html-nobg slide-globe-top-left video-offset">
          <h3>- Une opportunité unique -</h3>
          <h2 class="slide-title-leftalign red-title">Semestre à l'étranger</h2>
          <div class="flag-row">
            <img src="/static/media/flag-es.png"  alt="Espagne">
            <img src="/static/media/flag-usa.png"  alt="États-Unis">
            <img src="/static/media/flag-ger.png" alt="Allemagne">
            <img src="/static/media/flag-chi.png" alt="Chine">
            <img src="/static/media/flag-aus.png" alt="Australie">
            <img src="/static/media/flag-cor.png" alt="Corée du Sud">
            <img src="/static/media/flag-jap.png" alt="Japon">
            <img src="/static/media/flag-lux.png" alt="Luxembourg">
            <img src="/static/media/flag-nor.png" alt="Norvège">
            <img src="/static/media/flag-rou.png" alt="Roumanie">
            <img src="/static/media/flag-swi.png" alt="Suisse">
            <img src="/static/media/flag-tai.png" alt="Taïwan">
            <img src="/static/media/flag-tun.png" alt="Tunisie">
          </div>
          <p>Un semestre dans une université partenaire pour <br>
          perfectionner votre anglais et découvrir une nouvelle culture.</p>
          <a href="#" class="button-standard">Semestre à l'étranger</a>
        </div>
      `
    },
    {
      type: 'video',
      src: '/static/media/video1.mp4',
      alt: 'Vidéo Partenaires',
      captionHtml: `
        <div class="slide-inner-html-nobg centered video-offset">
          <h2 class="slide-title red-title">NOS PARTENAIRES</h2>
          <h3>Découvrez les institutions et organisations qui nous soutiennent dans notre mission.</h3>
          <div class="partners-logos">
            <img src="/static/media/logo-bloomberg.png" alt="Bloomberg" class="partner-logo">
            <img src="/static/media/logo-afg.png" alt="AFG" class="partner-logo">
            <img src="/static/media/logo-cfa.png" alt="CFA Institute" class="partner-logo">
            <img src="/static/media/logo-francepostmarche.png" alt="France Post-Marché" class="partner-logo">
          </div>
          <a href="#" class="button-standard">En savoir plus</a>
        </div>
      `
    },
    {
      type: 'video',
      src: '/static/media/video3.mp4',
      alt: 'Projets Universitaires',
      captionHtml: `
        <div class="slide-inner-html-nobg projects-slide-content"
             style="display: flex; align-items: center; gap: 2rem; justify-content: flex-start;">
          <div class="projects-info">
            <h2 class="slide-title-leftalign">Projets Universitaires</h2>
            <p style="font-size: 1.5rem; line-height: 1.5; margin-bottom: 2rem; color: #000;">
              Le Master G2C encourage la création de projets innovants en finance, <br>
              alliant développement de logiciels avec Python et VBA, tout en <br>
              accompagnant ses étudiants dans leur réalisation. <br>
            </p>
            <a href="#" class="button-standard" style="font-size: 1rem;">Découvrir les projets</a>
            <div class="tech-logos">
              <img src="/static/media/logo-python.png" alt="Python">
              <img src="/static/media/logo-excel.png" alt="Excel">
            </div>
          </div>
          <div class="cube-container" id="cube-container"></div>
        </div>
      `
    },
    {
      type: 'video',
      src: '/static/media/video4.mp4',
      alt: 'Caen, une ville universitaire dynamique',
      captionHtml: `
        <div class="slide-inner-html-nobg centered caen-slide-content">
          <h2 class="slide-title red-title">Caen, une ville universitaire dynamique</h2>
    
          <!-- Sous-titre avec classe pour le style -->
          <p class="caen-intro-text">
            Une ville jeune et accueillante pour les étudiants du monde entier
          </p>
    
          <!-- Conteneur flex sans fond noir -->
          <div class="caen-stats-wrapper">
            <!-- 1er bloc -->
            <div class="caen-stat-block">
              <div class="caen-stat-title">Classement</div>
              <div class="caen-stat-subtitle">Parmi les meilleures pour étudier</div>
            </div>
            <!-- 2e bloc -->
            <div class="caen-stat-block">
              <div class="caen-stat-title">30&nbsp;000+</div>
              <div class="caen-stat-subtitle">étudiants chaque année</div>
            </div>
            <!-- 3e bloc -->
            <div class="caen-stat-block">
              <div class="caen-stat-title">2h</div>
              <div class="caen-stat-subtitle">de Paris en train</div>
            </div>
          </div>
    
          <!-- Bouton qu'on abaisse un peu plus -->
          <a href="#" class="button-standard caen-lower-button">Site de l’université de Caen</a>
        </div>
      `
    }
    
  ];

  // -- 2. Sélecteurs --
  const slidesContainer = document.getElementById('slides-container');
  const navPrev = document.getElementById('nav-prev');
  const navCurrent = document.getElementById('nav-current');
  const navNext = document.getElementById('nav-next');

  // -- 3. Création des slides --
  slidesData.forEach(slideData => {
    const slideEl = createSlide(slideData);
    slidesContainer.appendChild(slideEl);
  });

  let currentIndex = 0;
  const totalSlides = slidesData.length;

  // -- 4. Fonction de création d'un slide --
  function createSlide(slideData) {
    const slideEl = document.createElement('div');
    slideEl.classList.add('slide');

    // Ajout des classes personnalisées si présentes
    if (slideData.classes && Array.isArray(slideData.classes)) {
      slideData.classes.forEach(cls => slideEl.classList.add(cls));
    }

    if (slideData.type === 'image') {
      const img = document.createElement('img');
      img.src = slideData.src;
      img.alt = slideData.alt || '';
      img.classList.add('slide-content');
      slideEl.appendChild(img);
    } else if (slideData.type === 'video') {
      const video = document.createElement('video');
      video.src = slideData.src;
      video.alt = slideData.alt || '';
      video.classList.add('slide-content');
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      slideEl.appendChild(video);
    } else if (slideData.type === '3d') {
      // Conteneur pour la scène 3D
      const container = document.createElement('div');
      container.id = slideData.containerId || '3d-container';
      container.classList.add('slide-3d-container');
      slideEl.appendChild(container);
    }

    if (slideData.captionHtml) {
      const captionWrapper = document.createElement('div');
      captionWrapper.innerHTML = slideData.captionHtml;
      slideEl.appendChild(captionWrapper);
    }

    return slideEl;
  }

  // -- 5. Cercle de progression --
  const ringCircle = document.querySelector('.progress-ring__circle');
  const circleLength = 75.4; // 2π * 12

  function resetProgressRing() {
    if (!ringCircle) return;
    ringCircle.style.transition = 'none';
    ringCircle.style.strokeDashoffset = circleLength + 0.5;
    ringCircle.getBoundingClientRect();
    setTimeout(() => {
      ringCircle.style.transition = 'stroke-dashoffset 10s linear';
      ringCircle.style.strokeDashoffset = 0;
    }, 50);
  }

  // -- 6. Navigation entre slides --
  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentIndex = index;
    slidesContainer.style.transform = `translateX(${-100 * currentIndex}%)`;

    navPrev.classList.remove('active');
    navCurrent.classList.remove('active');
    navNext.classList.remove('active');
    navCurrent.classList.add('active');

    resetProgressRing();
  }

  navPrev.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    clearInterval(autoSlideInterval);
  });

  navNext.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    clearInterval(autoSlideInterval);
  });

  // -- 7. Auto-défilement toutes les 10s --
  const autoSlideInterval = setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 10000);

  // -- 8. Afficher la première slide (index 0) --
  // Pour voir directement le globe, utilisez goToSlide(1);
  goToSlide(0);

});

document.addEventListener('DOMContentLoaded', function() {
  // Sélectionne la piste qui contient la liste de logos
  const track = document.getElementById('logosTrack');
  if (track) {
    // Clone tout l’intérieur de la piste
    const clone = track.innerHTML;
    // Ajoute ce clone à la fin
    track.innerHTML += clone;
  }
});
