document.addEventListener('DOMContentLoaded', () => {
    // --- Global Elements ---
    const viewport = document.getElementById('presentation-viewport');
    const container = document.getElementById('presentation-container');
    const track = document.getElementById('slide-track');
    const slides = document.querySelectorAll('.slide');
    
    // --- HUD Elements ---
    const prevBtn = document.getElementById('hud-prev');
    const nextBtn = document.getElementById('hud-next');
    const playBtn = document.getElementById('hud-play');
    const fullscreenBtn = document.getElementById('hud-fullscreen');
    const outlineBtn = document.getElementById('hud-outline');
    const progressBar = document.getElementById('hud-progress-bar');
    const progressContainer = document.getElementById('hud-progress-container');
    const counter = document.getElementById('hud-counter');
    const dotsContainer = document.getElementById('hud-dots');
    
    // --- Side Nav Arrows ---
    const leftArrow = document.getElementById('nav-arrow-left');
    const rightArrow = document.getElementById('nav-arrow-right');
    
    // --- Outline Drawer Elements ---
    const drawer = document.getElementById('outline-drawer');
    const drawerClose = document.getElementById('outline-close');
    const outlineList = document.getElementById('outline-list');
    
    // --- State Variables ---
    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval = null;
    let isPlaying = false;
    const autoPlayDelay = 8000; // 8 seconds per slide
    
    // Base dimensions for 16:9 projection scaling
    const baseWidth = 1920;
    const baseHeight = 1080;

    // --- 1. Responsive Scale Logic ---
    function adjustScale() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        const scaleX = windowWidth / baseWidth;
        const scaleY = windowHeight / baseHeight;
        
        // Fit container to window while maintaining 16:9 aspect ratio
        const scale = Math.min(scaleX, scaleY);
        
        container.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    
    window.addEventListener('resize', adjustScale);
    adjustScale(); // Initial call

    // --- 2. Navigation Engine ---
    function goToSlide(index) {
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;
        
        currentSlide = index;
        
        // Shift track horizontally
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update slide activity classes for entrance animations
        slides.forEach((slide, idx) => {
            if (idx === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        // Update HUD
        updateHUD();
        
        // Auto-pause if we reach the end
        if (currentSlide === totalSlides - 1 && isPlaying) {
            pausePresentation();
        }
        
        // Dynamic Radial SVG redraw — fires for whichever slide holds the diagram
        if (slides[currentSlide].querySelector('#radial-svg-connections')) {
            drawRadialConnections();
        }
    }
    
    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        } else if (isPlaying) {
            goToSlide(0); // Loop if auto-playing
        }
    }
    
    function prevSlide() {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }
    
    // HUD Updates
    function updateHUD() {
        // Update progress bar
        const progressPercent = ((currentSlide + 1) / totalSlides) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // Update slide counter
        counter.textContent = `${String(currentSlide + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
        
        // Update Dots
        const dots = dotsContainer.querySelectorAll('.hud-dot');
        dots.forEach((dot, idx) => {
            if (idx === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Update Outline Active item
        const outlineItems = outlineList.querySelectorAll('.outline-item');
        outlineItems.forEach((item, idx) => {
            if (idx === currentSlide) {
                item.classList.add('active');
                // Scroll outline list to center active item if needed (only if drawer is open)
                if (drawer.classList.contains('open')) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Initialize Dot Indicators
    function initDots() {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('hud-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                goToSlide(i);
                pausePresentation();
            });
            dotsContainer.appendChild(dot);
        }
    }
    initDots();

    // Initialize Outline items
    function initOutline() {
        outlineList.innerHTML = '';
        slides.forEach((slide, idx) => {
            const titleEl = slide.querySelector('.slide-title');
            const slideTitle = titleEl ? titleEl.textContent : `Slide ${idx + 1}`;
            
            const item = document.createElement('div');
            item.classList.add('outline-item');
            if (idx === 0) item.classList.add('active');
            
            item.innerHTML = `
                <span class="outline-num">${String(idx + 1).padStart(2, '0')}</span>
                <span class="outline-title">${slideTitle}</span>
            `;
            
            item.addEventListener('click', () => {
                goToSlide(idx);
                closeDrawer();
                pausePresentation();
            });
            outlineList.appendChild(item);
        });
    }

    // --- 3. Auto-play System ---
    function playPresentation() {
        isPlaying = true;
        playBtn.innerHTML = '⏸'; // Pause character
        playBtn.classList.add('active');
        
        autoPlayInterval = setInterval(() => {
            nextSlide();
        }, autoPlayDelay);
    }
    
    function pausePresentation() {
        isPlaying = false;
        playBtn.innerHTML = '▶'; // Play character
        playBtn.classList.remove('active');
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }
    
    function togglePlay() {
        if (isPlaying) {
            pausePresentation();
        } else {
            playPresentation();
        }
    }

    // --- 4. Input Listeners ---
    
    // Key binds
    document.addEventListener('keydown', (e) => {
        // Prevent default actions for slide controls if user is not typing in inputs
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case 'ArrowRight':
            case 'Space':
            case ' ':
            case 'PageDown':
                nextSlide();
                pausePresentation();
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'Backspace':
            case 'PageUp':
                prevSlide();
                pausePresentation();
                e.preventDefault();
                break;
            case 'Home':
                goToSlide(0);
                pausePresentation();
                e.preventDefault();
                break;
            case 'End':
                goToSlide(totalSlides - 1);
                pausePresentation();
                e.preventDefault();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
        }
    });

    // Mouse wheel scrolling (with 800ms debounce to feel smooth and intentional)
    let lastWheelTime = 0;
    const wheelCooldown = 800;
    
    window.addEventListener('wheel', (e) => {
        const currentTime = new Date().getTime();
        if (currentTime - lastWheelTime < wheelCooldown) return;
        
        // Don't scroll slides if outline drawer or lightbox is open and scrollable
        if (drawer.classList.contains('open') || document.getElementById('lightbox').classList.contains('open')) {
            return;
        }
        
        if (e.deltaY > 30) {
            nextSlide();
            pausePresentation();
            lastWheelTime = currentTime;
        } else if (e.deltaY < -30) {
            prevSlide();
            pausePresentation();
            lastWheelTime = currentTime;
        }
    }, { passive: true });

    // Touch Swipe gestures for tablets
    let touchStartX = 0;
    let touchEndX = 0;
    
    window.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    window.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const threshold = 50; // swipe minimum distance
        if (touchEndX < touchStartX - threshold) {
            nextSlide();
            pausePresentation();
        }
        if (touchEndX > touchStartX + threshold) {
            prevSlide();
            pausePresentation();
        }
    }

    // Click navigation on HUD elements
    prevBtn.addEventListener('click', () => { prevSlide(); pausePresentation(); });
    nextBtn.addEventListener('click', () => { nextSlide(); pausePresentation(); });
    leftArrow.addEventListener('click', () => { prevSlide(); pausePresentation(); });
    rightArrow.addEventListener('click', () => { nextSlide(); pausePresentation(); });
    playBtn.addEventListener('click', togglePlay);
    
    // Progress Bar jumping
    progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const targetPercent = clickX / width;
        const targetSlide = Math.floor(targetPercent * totalSlides);
        goToSlide(targetSlide);
        pausePresentation();
    });

    // Fullscreen toggling
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error enabling fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    fullscreenBtn.addEventListener('click', () => {
        toggleFullscreen();
        pausePresentation();
    });
    
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '⛶'; // Active/Exit symbol or just styling
            fullscreenBtn.classList.add('active');
        } else {
            fullscreenBtn.innerHTML = '⛶';
            fullscreenBtn.classList.remove('active');
        }
    });

    // Outline Drawer controls
    function openDrawer() {
        drawer.classList.add('open');
        outlineBtn.classList.add('active');
        
        // Scroll active item into view when drawer opens
        setTimeout(() => {
            const activeItem = outlineList.querySelector('.outline-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 150);
    }
    
    function closeDrawer() {
        drawer.classList.remove('open');
        outlineBtn.classList.remove('active');
    }
    
    outlineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (drawer.classList.contains('open')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    });
    
    drawerClose.addEventListener('click', closeDrawer);
    
    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
        if (!drawer.contains(e.target) && e.target !== outlineBtn) {
            closeDrawer();
        }
    });

    // --- 5. Interactive Slides Scripting ---

    // --- Slide 3: Interactive Path Milestone Nodes ---
    const pathNodes = document.querySelectorAll('.path-node');
    const pathContentTitle = document.getElementById('path-content-title');
    const pathContentBody = document.getElementById('path-content-body');
    
    const pathMilestoneTexts = [
        {
            title: "Estacionamento do CT (1.200m²)",
            body: "Requalificação do espaço subutilizado e arborizado do CT. Implantação de sensores de controle de vagas em tempo real e pontos de carregamento rápido para veículos elétricos (incentivo à mobilidade de baixo carbono). Os conselheiros e visitantes do CONSU estacionam aqui."
        },
        {
            title: "Pocket HIDS: O Percurso Vivo (100 metros)",
            body: "O trajeto de 100 metros se transforma em um parque urbano e laboratório vivo. Ao invés de uma caminhada monótona, o pedestre desfruta de pergolados solares, jardins de chuva que drenam águas pluviais, um hotel de abelhas nativas polinizadoras e painéis que monitoram a qualidade ambiental."
        },
        {
            title: "Prédio do Novo CONSU (Antigo Banco do Brasil)",
            body: "O destino final. Uma chegada majestosa, acessível e integrada. O percurso conecta diretamente a via do estacionamento à porta principal do prédio, promovendo a integração entre a governança máxima da Unicamp e o distrito de inovação territorial sustentável."
        }
    ];
    
    pathNodes.forEach((node, idx) => {
        node.addEventListener('click', () => {
            pathNodes.forEach(n => n.classList.remove('active'));
            node.classList.add('active');
            
            // Fade text out and back in
            pathContentTitle.style.opacity = 0;
            pathContentBody.style.opacity = 0;
            
            setTimeout(() => {
                pathContentTitle.textContent = pathMilestoneTexts[idx].title;
                pathContentBody.textContent = pathMilestoneTexts[idx].body;
                pathContentTitle.style.opacity = 1;
                pathContentBody.style.opacity = 1;
            }, 300);
        });
    });

    // --- Slide 5: Render Gallery & Lightbox ---
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    
    let currentGalleryIndex = 0;
    const galleryImages = [];
    
    // Auto-populate gallery array from DOM structure
    galleryItems.forEach((item, idx) => {
        const img = item.querySelector('img');
        const caption = item.querySelector('.gallery-overlay span').textContent;
        galleryImages.push({
            src: img.src,
            caption: item.dataset.caption || caption
        });
        
        // Gallery is static (no click-to-expand) — images shown directly on the slide
    });
    
    function openLightbox() {
        lightbox.classList.add('open');
        updateLightboxImage();
        pausePresentation();
    }
    
    function closeLightbox() {
        lightbox.classList.remove('open');
    }
    
    function updateLightboxImage() {
        const item = galleryImages[currentGalleryIndex];
        lightboxImg.src = item.src;
        lightboxCaption.textContent = item.caption;
    }
    
    function prevLightboxImage() {
        currentGalleryIndex = (currentGalleryIndex > 0) ? currentGalleryIndex - 1 : galleryImages.length - 1;
        updateLightboxImage();
    }
    
    function nextLightboxImage() {
        currentGalleryIndex = (currentGalleryIndex < galleryImages.length - 1) ? currentGalleryIndex + 1 : 0;
        updateLightboxImage();
    }
    
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', prevLightboxImage);
    lightboxNext.addEventListener('click', nextLightboxImage);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // --- Slide 6: Interactive 6 Pavilions Card Selection ---
    const pavilionCards = document.querySelectorAll('.pavilion-card');
    const detailTitle = document.getElementById('pavilion-detail-title');
    const detailDesc = document.getElementById('pavilion-detail-desc');
    
    const pavilionDetailTexts = {
        energia: "O Pergolado Fotovoltaico instalado no deck do Pocket HIDS gera energia limpa local e alimenta tomadas públicas para notebooks, iluminação cênica e o grid experimental. É a representação em micro-escala das redes inteligentes de energia do futuro pavilhão.",
        tic: "Estações meteorológicas completas, sensores de umidade de solo, contadores de fluxo de pedestres e sensores de poluição. Todos os dados são centralizados em um banco acessível, permitindo pesquisas e desenvolvimento em cidades inteligentes (Smart Cities).",
        mobilidade: "Conexão direta com o estacionamento inteligente do CT. Carregadores elétricos automotivos integrados, demarcação de vagas com sensores infravermelhos e rotas acessíveis de caminhada reduzem a pegada de carbono do deslocamento universitário.",
        biotecnologia: "A agrofloresta urbana, o plantio de árvores frutíferas nativas e o hotel de abelhas nativas sem ferrão resgatam e fortificam a flora/fauna local. É o pavilhão de bio-inovação atuando na regulação ecológica de áreas antropizadas.",
        quanticas: "Sensores fotônicos instalados para o monitoramento contínuo da saúde das árvores (fluxo de seiva, estresse hídrico). Conectados a um grid de fibras e lasers experimentais que demonstram tecnologias de comunicação quântica e medição ambiental refinada.",
        transicao: "O anfiteatro em patamares verdes fornece um espaço de assembleia popular, educação e engajamento comunitário. A ciência cidadã é incentivada pela visualização pública de métricas de impacto climático do projeto, criando pontes de governança democrática."
    };
    
    if (detailTitle && detailDesc) pavilionCards.forEach(card => {
        card.addEventListener('click', () => {
            pavilionCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            const pavKey = card.dataset.pavilion;
            detailTitle.style.opacity = 0;
            detailDesc.style.opacity = 0;
            
            setTimeout(() => {
                detailTitle.textContent = card.querySelector('.pavilion-title').textContent;
                detailDesc.textContent = pavilionDetailTexts[pavKey];
                detailTitle.style.opacity = 1;
                detailDesc.style.opacity = 1;
            }, 200);
        });
    });

    // --- Slide 7: Requirements Program Tab Panel ---
    const zoneTabBtns = document.querySelectorAll('.zone-tab-btn');
    const zonePanels = document.querySelectorAll('.zone-panel');
    
    zoneTabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            zoneTabBtns.forEach(b => b.classList.remove('active'));
            zonePanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            zonePanels[idx].classList.add('active');
        });
    });

    // --- Slide 10: Timeline Schedule Phases ---
    const timelineSteps = document.querySelectorAll('.timeline-step');
    const timelineTitle = document.getElementById('timeline-details-title');
    const timelineDesc = document.getElementById('timeline-details-desc');
    
    const phaseDescriptions = [
        {
            title: "Fase 1: Infraestrutura Base (Meses 01 – 08)",
            desc: "Foco total na preparação territorial. Terraplanagem, drenagem de solo, instalação das redes de água e dutos de utilidades (fibra óptica, energia). Implantação da estrutura inicial do deck e pergolado, além da montagem dos painéis solares para alimentação do canteiro. Entrega da praça de chegada."
        },
        {
            title: "Fase 2: Instalações Experimentais (Meses 09 – 16)",
            desc: "Construção do anfiteatro verde em patamares de solo armado, plantio da agrofloresta e instalação das bacias de biorretenção do jardim de chuva. Início da fiação e implantação do grid de utilidades inteligentes de dados e conectividade de sensores ambientais. Montagem do hotel de abelhas."
        },
        {
            title: "Fase 3: Expansão e Consolidação (Meses 17 – 24)",
            desc: "Implantação dos jardins verticais com irrigação automatizada nos prédios circundantes, ativação do painel digital interativo de monitoramento ambiental e estações meteorológicas definitivas. Instalação do mobiliário urbano acessível, iluminação cênica final e abertura oficial como laboratório de engajamento público."
        }
    ];
    
    if (timelineTitle && timelineDesc) timelineSteps.forEach((step, idx) => {
        step.addEventListener('click', () => {
            timelineSteps.forEach(s => s.classList.remove('active'));
            step.classList.add('active');
            
            timelineTitle.style.opacity = 0;
            timelineDesc.style.opacity = 0;
            
            setTimeout(() => {
                timelineTitle.textContent = phaseDescriptions[idx].title;
                timelineDesc.textContent = phaseDescriptions[idx].desc;
                timelineTitle.style.opacity = 1;
                timelineDesc.style.opacity = 1;
            }, 200);
        });
    });

    // --- Slide 12: Radial Pavilion Connections Mapping ---
    const radialSvg = document.getElementById('radial-svg-connections');
    const radialNodes = document.querySelectorAll('.radial-node');
    const radialCenter = document.querySelector('.radial-center');
    const radialPopup = document.getElementById('radial-info-popup');
    
    const pavilionRadialTexts = {
        energia: "Pavilhão de Energia: Conecta-se ao Pergolado Solar do Pocket HIDS, integrando produção renovável descentralizada e recarga elétrica inteligente.",
        tic: "Pavilhão de TIC: Conecta-se aos Sensores Ambientais e estações IoT que coletam dados climáticos e hidrológicos em tempo real.",
        mobilidade: "Pavilhão de Mobilidade: Conecta-se ao Estacionamento do CT e às rotas de desenho universal, reduzindo barreiras físicas e carbônicas.",
        biotecnologia: "Pavilhão de Biotecnologia: Conecta-se à Agrofloresta, ao Hotel de Abelhas nativas e aos jardins ecológicos para pesquisa de biodiversidade urbana.",
        quanticas: "Pavilhão de Tecnologias Quânticas: Conecta-se ao Grid de Fibras do parque e aos sensores fotônicos de análise celular e fisiologia vegetal.",
        transicao: "Pavilhão de Transição Justa: Conecta-se ao Anfiteatro verde, servindo como polo de engajamento comunitário, tomada de decisão e ciência cidadã."
    };
    
    function drawRadialConnections() {
        if (!radialSvg) return;
        
        // Clear previous lines
        radialSvg.innerHTML = '';
        
        const centerRect = radialCenter.getBoundingClientRect();
        const svgRect = radialSvg.getBoundingClientRect();
        
        // Center of radial diagram relative to SVG container
        const cx = (centerRect.left + centerRect.width / 2) - svgRect.left;
        const cy = (centerRect.top + centerRect.height / 2) - svgRect.top;
        
        radialNodes.forEach(node => {
            const nodeRect = node.getBoundingClientRect();
            const nx = (nodeRect.left + nodeRect.width / 2) - svgRect.left;
            const ny = (nodeRect.top + nodeRect.height / 2) - svgRect.top;
            
            // Create SVG Line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', cx);
            line.setAttribute('y1', cy);
            line.setAttribute('x2', nx);
            line.setAttribute('y2', ny);
            line.setAttribute('stroke', 'rgba(16, 185, 129, 0.2)');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '5,5');
            
            // Save coordinates on node for line references on hover
            node.lineRef = line;
            
            radialSvg.appendChild(line);
        });
    }
    
    radialNodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            if (node.lineRef) {
                node.lineRef.setAttribute('stroke', '#10b981');
                node.lineRef.setAttribute('stroke-width', '4');
                node.lineRef.removeAttribute('stroke-dasharray');
            }
        });
        
        node.addEventListener('mouseleave', () => {
            if (node.lineRef) {
                node.lineRef.setAttribute('stroke', 'rgba(16, 185, 129, 0.2)');
                node.lineRef.setAttribute('stroke-width', '2');
                node.lineRef.setAttribute('stroke-dasharray', '5,5');
            }
        });
        
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = node.dataset.pavilion;
            radialPopup.textContent = pavilionRadialTexts[key];
            radialPopup.style.display = 'block';
            
            // Position popup centrally above center or below
            radialPopup.style.left = '50%';
            radialPopup.style.transform = 'translateX(-50%)';
            radialPopup.style.bottom = '-40px';
        });
    });
    
    // Close radial popup when clicking anywhere else
    document.addEventListener('click', () => {
        if (radialPopup) radialPopup.style.display = 'none';
    });
    
    // Redraw connections if slide becomes active
    // We already do this inside goToSlide, but let's add a general resize bind
    window.addEventListener('resize', () => {
        if (slides[currentSlide].querySelector('#radial-svg-connections')) {
            setTimeout(drawRadialConnections, 100);
        }
    });

    // --- Slide 13: Dean Collaborative Checklist ---
    const checklistItems = document.querySelectorAll('.checklist-item');
    checklistItems.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('checked');
        });
    });

    // --- Slide 14: Celebration Canvas particle effect ---
    const ctaBtn = document.getElementById('cta-celebrate-btn');
    const canvas = document.getElementById('celebrate-canvas');
    let ctx = null;
    
    if (canvas) {
        ctx = canvas.getContext('2d');
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    let particles = [];
    const colors = ['#10b981', '#34d399', '#059669', '#f97316', '#3b82f6', '#f43f5e', '#eab308'];
    
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 8 + 4;
            this.speedX = Math.random() * 8 - 4;
            this.speedY = Math.random() * -12 - 5; // Shoot upwards
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.gravity = 0.2;
            this.life = 100;
            this.opacity = 1;
        }
        
        update() {
            this.speedY += this.gravity;
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= 1.5;
            this.opacity = this.life / 100;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    function animateParticles() {
        if (particles.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }
        
        requestAnimationFrame(animateParticles);
    }
    
    if (ctaBtn) {
        ctaBtn.addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            // Origin of particles is the center of the button click
            const originX = rect.left + rect.width / 2;
            const originY = rect.top + rect.height / 2;
            
            // Spawn 100 particles
            for (let i = 0; i < 120; i++) {
                particles.push(new Particle(originX, originY));
            }
            
            animateParticles();
            
            // Play a celebratory visual scale effect on the button
            ctaBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                ctaBtn.style.transform = '';
            }, 150);
        });
    }

    // --- 6. Initial Configuration Setup ---
    initOutline();
    goToSlide(0); // Trigger initial slide setup
});
