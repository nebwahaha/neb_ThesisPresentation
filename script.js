// ===== CONFIGURATION =====
const CONFIG = {
    scrollSpeed: 0.9,           // Balanced scroll speed
    snapDelay: 250,             // Quick snap response
    snapThreshold: 0.45,        // Snap within 45% of section
    snapDuration: 500,          // Noticeable but smooth snap
    keyScrollAmount: 30,        // Larger keyboard scroll steps
    minScrollVelocity: 2        // Minimum velocity to prevent snap
};

// ===== DOM ELEMENTS =====
const DOM = {
    hamburger: document.getElementById('hamburger'),
    navMenu: document.getElementById('navMenu'),
    closeBtn: document.getElementById('closeBtn'),
    navLinks: document.getElementById('navLinks'),
    scrollProgress: document.getElementById('scrollProgress'),
    leftSide: document.getElementById('leftSide'),
    rightSide: document.getElementById('rightSide'),
    chapterIndicator: document.getElementById('chapterIndicator')
};

// ===== STATE =====
let state = {
    scrollPosition: 0,
    lastScrollPosition: 0,
    isSnapping: false,
    isTouching: false,
    touchStartY: 0,
    touchCurrentY: 0,
    scrollVelocity: 0
};

let timers = {
    scroll: null,
    keyScroll: null,
    resize: null
};

// ===== INITIALIZATION =====
function init() {
    generateContent();
    generateNavigation();
    setupEventListeners();
    updateSections();
    fadeInPage();
}

// ===== CONTENT GENERATION =====
function generateContent() {
    sections.forEach((section, index) => {
        // Generate left side content
        const leftContent = createLeftContent(section, index);
        DOM.leftSide.appendChild(leftContent);

        // Generate right side content
        const rightContent = createRightContent(section, index);
        DOM.rightSide.appendChild(rightContent);
    });
}

function createLeftContent(section, index) {
    const div = document.createElement('div');
    div.className = 'left-content';
    div.dataset.section = index;

    if (index === 0) {
        // Title section
        div.innerHTML = `
            <h1 class="main-title">${section.title}</h1>
            <p class="subtitle">${section.subtitle}</p>
            ${section.subtext ? `<p class="subtitle-small">${section.subtext}</p>` : ''}
        `;
    } else if (section.content.isThankYouPage) {
        // Thank you page - with floating animation
        div.innerHTML = `
            <h2 class="section-title thank-you-left">${section.title}</h2>
        `;
        div.classList.add('thank-you-left-container');
    } else {
        // Regular sections
        div.innerHTML = `
            <h2 class="section-title">${section.title}</h2>
            <p class="section-text">${section.subtitle}</p>
        `;
    }

    return div;
}

function createRightContent(section, index) {
    const div = document.createElement('div');
    div.className = 'right-content';
    div.dataset.section = index;

    const contentBox = document.createElement('div');
    contentBox.className = 'content-box';

    // Scroll hint for first section
    if (section.content.showScrollHint) {
        contentBox.innerHTML = `
            <div class="scroll-hint">
                <span>Scroll to explore</span>
                <div class="arrow-down"></div>
            </div>
        `;
        div.classList.add('scroll-hint-container');
    } else if (section.content.isThankYouPage) {
        // Thank you page - only author name and thesis title
        contentBox.innerHTML = `
            <div class="thank-you-page">
                <div class="thank-you-content-right">
                    <p class="thank-you-author">${section.content.authorName}</p>
                    <p class="thank-you-thesis">${section.content.thesisTitle}</p>
                </div>
            </div>
        `;
        div.classList.add('thank-you-page-container');
    } else {
        // Regular content
        let html = '';
        
        if (section.content.heading) {
            html += `<h3>${section.content.heading}</h3>`;
        }
        
        if (section.content.text) {
            html += `<p>${section.content.text}</p>`;
        }
        
        if (section.content.hasImage) {
            html += `
                <div class="image-placeholder-container">
                    <div class="image-placeholder" data-section-id="${section.id}">
                        <img src="sample.png" alt="Section image" class="placeholder-image" />
                        <div class="placeholder-overlay">
                            <p>Click to expand</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (section.content.link) {
            html += `<a href="${section.content.link.url}" target="_blank" class="content-link">${section.content.link.text}</a>`;
        }
        
        if (section.content.items && section.content.items.length > 0) {
            html += '<ul>';
            section.content.items.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += '</ul>';
        }
        
        if (section.content.showThankYou) {
            html += `
                <div class="thank-you">
                    <h2>THANK YOU</h2>
                    <p>Questions?</p>
                </div>
            `;
        }
        
        contentBox.innerHTML = html;
    }

    div.appendChild(contentBox);
    return div;
}

function generateNavigation() {
    // Define which sections are main chapters/separators
    const mainSections = ['CHAPTER 1', 'CHAPTER 2', 'LOGICAL DESIGN', 'UML', 'SYSTEM REQUIREMENTS', 'APPENDICES'];
    const chapterSubSections = {
        'CHAPTER 1': ['BACKGROUND OF THE STUDY', 'PIECES FRAMEWORK', 'PERFORMANCE PROBLEMS', 'INFORMATION PROBLEMS', 
                      'ECONOMIC PROBLEMS', 'CONTROL PROBLEMS', 'EFFICIENCY PROBLEMS', 'SERVICE PROBLEMS', 
                      'RESEARCH OBJECTIVES', 'GENERAL OBJECTIVES', 'SPECIFIC OBJECTIVES', 'SIGNIFICANCE OF THE STUDY', 
                      'SCOPE AND LIMITATION', 'REVIEW OF RELATED LITERATURE', 'SYNTHESIS', 'CONCEPTUAL FRAMEWORK', 
                      'DEFINITION OF TERMS'],
        'CHAPTER 2': ['DESCRIPTION OF THE PROPOSED SYSTEM', 'SYSTEM ARCHITECTURE', 'SYSTEM FLOWCHART', 
                      'ENTITY RELATIONSHIP DIAGRAM', 'DATA DICTIONARY', 'DATABASE SCHEMA'],
        'LOGICAL DESIGN': ['CONTEXT DIAGRAM', 'DATA FLOW DIAGRAM LEVEL 0', 'DATA FLOW DIAGRAM LEVEL 1'],
        'UML': ['USE CASE DIAGRAM', 'SEQUENCE DIAGRAM', 'CLASS DIAGRAM', 'ACTIVITY DIAGRAM', 'STATE DIAGRAM'],
        'SYSTEM REQUIREMENTS': ['INSTALLATION', 'TRAINING', 'DOCUMENTATION', 'IMPLEMENTATION', 'FEASIBILITY STUDY',
                                'TECHNICAL', 'OPERATIONAL', 'SCHEDULE', 'COST BENEFIT ANALYSIS', 'BENEFITS',
                                'TANGIBLE BENEFITS', 'INTANGIBLE BENEFITS', 'COMMERCIAL VIABILITY', 'REFERENCES'],
        'APPENDICES': ['PROJECT TIME TABLE', 'GRAPHICAL USER INTERFACES']
    };

    let currentMainSection = null;

    sections.forEach((section, index) => {
        // Skip the thank you page in navigation
        if (section.content.isThankYouPage) {
            return;
        }

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = section.title;
        a.dataset.section = index;

        // Check if this is a main section
        if (mainSections.includes(section.title)) {
            a.className = 'nav-link nav-link-main';
            currentMainSection = section.title;
            
            // Add separator before main sections (except first one)
            if (index > 0) {
                li.classList.add('nav-separator');
            }
        } 
        // Check if this is a subsection of current main section
        else if (currentMainSection && chapterSubSections[currentMainSection]?.includes(section.title)) {
            a.className = 'nav-link nav-link-sub';
        }
        // Regular section
        else {
            a.className = 'nav-link';
            currentMainSection = null; // Reset if we're out of subsections
        }

        li.appendChild(a);
        DOM.navLinks.appendChild(li);
    });
}

// ===== SCROLL LOGIC =====
const totalSections = sections.length;
const maxScroll = (totalSections - 1) * 100;

function updateSections() {
    const sectionProgress = state.scrollPosition / 100;
    const leftContents = document.querySelectorAll('.left-content');
    const rightContents = document.querySelectorAll('.right-content');

    // Update left side (scrolls down)
    leftContents.forEach((content, index) => {
        const offset = (index - sectionProgress) * 100;
        content.style.transform = `translateY(${offset}vh)`;
        
        const distance = Math.abs(index - sectionProgress);
        content.style.opacity = Math.max(0, 1 - distance);
    });

    // Update right side (scrolls up - opposite direction)
    rightContents.forEach((content, index) => {
        const offset = (sectionProgress - index) * 100;
        content.style.transform = `translateY(${offset}vh)`;
        
        const distance = Math.abs(index - sectionProgress);
        content.style.opacity = Math.max(0, 1 - distance);
    });

    // Update progress bar
    const progress = (state.scrollPosition / maxScroll) * 100;
    DOM.scrollProgress.style.width = Math.min(100, Math.max(0, progress)) + '%';

    // Update active nav link
    updateActiveNavLink();
}

function snapToSection() {
    if (state.isSnapping) return;

    const currentSectionFloat = state.scrollPosition / 100;
    const nearestSection = Math.round(currentSectionFloat);
    const distanceFromNearest = Math.abs(currentSectionFloat - nearestSection);
    
    // Always snap if within threshold
    if (distanceFromNearest > CONFIG.snapThreshold) {
        return; // Too far from any section, don't snap
    }
    
    const targetPosition = nearestSection * 100;
    
    // Already at target
    if (Math.abs(state.scrollPosition - targetPosition) < 0.5) {
        state.scrollPosition = targetPosition;
        state.lastScrollPosition = targetPosition;
        return;
    }

    state.isSnapping = true;
    const startPosition = state.scrollPosition;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / CONFIG.snapDuration, 1);
        
        // Ease-out-quad for noticeable but smooth snap
        const easeProgress = progress * (2 - progress);

        state.scrollPosition = startPosition + (distance * easeProgress);
        state.lastScrollPosition = state.scrollPosition;
        updateSections();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            state.isSnapping = false;
            state.scrollPosition = targetPosition;
            state.lastScrollPosition = targetPosition;
            updateSections();
        }
    }

    requestAnimationFrame(animate);
}

function updateActiveNavLink() {
    const currentSectionIndex = Math.round(state.scrollPosition / 100);
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach((link, index) => {
        if (index === currentSectionIndex) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update chapter indicator
    updateChapterIndicator(currentSectionIndex);
}

function updateChapterIndicator(currentSectionIndex) {
    if (!DOM.chapterIndicator || currentSectionIndex < 0 || currentSectionIndex >= sections.length) return;
    
    const currentSection = sections[currentSectionIndex];
    const sectionTitle = currentSection.title;
    
    // Define chapter ranges
    const chapterRanges = {
        'CHAPTER 1': ['CHAPTER 1', 'BACKGROUND OF THE STUDY', 'PIECES FRAMEWORK', 'PERFORMANCE PROBLEMS', 
                      'INFORMATION PROBLEMS', 'ECONOMIC PROBLEMS', 'CONTROL PROBLEMS', 'EFFICIENCY PROBLEMS', 
                      'SERVICE PROBLEMS', 'RESEARCH OBJECTIVES', 'GENERAL OBJECTIVES', 'SPECIFIC OBJECTIVES', 
                      'SIGNIFICANCE OF THE STUDY', 'SCOPE AND LIMITATION', 'REVIEW OF RELATED LITERATURE', 
                      'SYNTHESIS', 'CONCEPTUAL FRAMEWORK', 'DEFINITION OF TERMS'],
        'CHAPTER 2': ['CHAPTER 2', 'DESCRIPTION OF THE PROPOSED SYSTEM', 'SYSTEM ARCHITECTURE', 'SYSTEM FLOWCHART', 
                      'ENTITY RELATIONSHIP DIAGRAM', 'DATA DICTIONARY', 'DATABASE SCHEMA'],
        'LOGICAL DESIGN': ['LOGICAL DESIGN', 'CONTEXT DIAGRAM', 'DATA FLOW DIAGRAM LEVEL 0', 'DATA FLOW DIAGRAM LEVEL 1'],
        'UML': ['UML', 'USE CASE DIAGRAM', 'SEQUENCE DIAGRAM', 'CLASS DIAGRAM', 'ACTIVITY DIAGRAM', 'STATE DIAGRAM'],
        'SYSTEM REQUIREMENTS': ['SYSTEM REQUIREMENTS', 'INSTALLATION', 'TRAINING', 'DOCUMENTATION', 'IMPLEMENTATION', 
                                'FEASIBILITY STUDY', 'TECHNICAL', 'OPERATIONAL', 'SCHEDULE', 'COST BENEFIT ANALYSIS', 
                                'BENEFITS', 'TANGIBLE BENEFITS', 'INTANGIBLE BENEFITS', 'COMMERCIAL VIABILITY', 'REFERENCES'],
        'APPENDICES': ['APPENDICES', 'PROJECT TIME TABLE', 'GRAPHICAL USER INTERFACES']
    };
    
    // Determine which chapter we're in
    let chapterName = 'Thesis Presentation'; // Default for title page
    
    for (const [chapter, sections] of Object.entries(chapterRanges)) {
        if (sections.includes(sectionTitle)) {
            chapterName = chapter;
            break;
        }
    }
    
    // Update the indicator text
    DOM.chapterIndicator.textContent = chapterName;
}

// ===== EVENT HANDLERS =====
function handleWheel(e) {
    // Check if modal is open and image is zoomed
    const modal = document.getElementById('imageModal');
    if (modal && modal.classList.contains('active')) {
        // Let the modal handle the wheel event, don't scroll main site
        return;
    }
    
    if (DOM.navMenu.classList.contains('active')) return;
    
    e.preventDefault();
    state.isSnapping = false;

    state.scrollPosition += e.deltaY * CONFIG.scrollSpeed / 10;
    state.scrollPosition = Math.max(0, Math.min(maxScroll, state.scrollPosition));
    
    updateSections();

    clearTimeout(timers.scroll);
    timers.scroll = setTimeout(snapToSection, CONFIG.snapDelay);
}

function handleTouchStart(e) {
    if (DOM.navMenu.classList.contains('active')) return;
    
    state.touchStartY = e.changedTouches[0].screenY;
    state.touchCurrentY = state.touchStartY;
    state.isTouching = true;
}

function handleTouchMove(e) {
    if (!state.isTouching || DOM.navMenu.classList.contains('active')) return;
    
    state.isSnapping = false;
    state.touchCurrentY = e.changedTouches[0].screenY;
    const diff = state.touchStartY - state.touchCurrentY;

    state.scrollPosition += diff * 0.5;
    state.scrollPosition = Math.max(0, Math.min(maxScroll, state.scrollPosition));
    
    updateSections();
    state.touchStartY = state.touchCurrentY;
}

function handleTouchEnd() {
    state.isTouching = false;
    setTimeout(snapToSection, 50);
}

function handleKeyDown(e) {
    if (DOM.navMenu.classList.contains('active')) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.isSnapping = false;
        state.scrollPosition = Math.min(maxScroll, state.scrollPosition + CONFIG.keyScrollAmount);
        updateSections();
        
        clearTimeout(timers.keyScroll);
        timers.keyScroll = setTimeout(snapToSection, 150);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.isSnapping = false;
        state.scrollPosition = Math.max(0, state.scrollPosition - CONFIG.keyScrollAmount);
        updateSections();
        
        clearTimeout(timers.keyScroll);
        timers.keyScroll = setTimeout(snapToSection, 150);
    } else if (e.key === 'Escape' && DOM.navMenu.classList.contains('active')) {
        closeMenu();
    }
}

function handleResize() {
    clearTimeout(timers.resize);
    timers.resize = setTimeout(updateSections, 250);
}

// ===== MENU FUNCTIONS =====
function openMenu() {
    DOM.navMenu.classList.add('active');
    DOM.hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    DOM.navMenu.classList.remove('active');
    DOM.hamburger.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function handleNavClick(e) {
    if (e.target.classList.contains('nav-link')) {
        const sectionIndex = parseInt(e.target.dataset.section);
        closeMenu();
        
        setTimeout(() => {
            state.scrollPosition = sectionIndex * 100;
            updateSections();
        }, 300);
    }
}

// ===== MOUSE TRACKING FOR THANK YOU PAGE =====
function setupMouseTracking() {
    document.addEventListener('mousemove', (e) => {
        const thankYouContent = document.querySelector('.thank-you-content');
        if (!thankYouContent) return;

        // Get the center of the viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Calculate distance from center
        const distX = (e.clientX - centerX) * 0.05;
        const distY = (e.clientY - centerY) * 0.05;

        // Apply transform to follow cursor
        thankYouContent.style.transform = `translate(${distX}px, ${distY}px)`;
    });
}

// ===== IMAGE MODAL FUNCTIONS =====
function setupImageModal() {
    // Define images for each section (can have multiple images)
    const sectionImages = {
        'framework': ['sample.png'],
        'system-architecture': ['sample.png'],
        'system-flowchart': ['sample.png'],
        'erd': ['sample.png'],
        'context-diagram': ['sample.png'],
        'dfd-level0': ['sample.png'],
        'dfd-level1': ['sample.png'],
        'use-case': ['sample.png'],
        'sequence-diagram': ['sample.png'],
        'class-diagram': ['sample.png'],
        'activity-diagram': ['sample.png'],
        'state-diagram': ['sample.png'],
        'project-timetable': ['sample.png']
    };
    
    // Create modal HTML
    const modalHTML = `
        <div id="imageModal" class="image-modal">
            <div class="image-modal-content">
                <button class="image-modal-close">&times;</button>
                <div class="image-modal-controls">
                    <button class="zoom-in-btn" title="Zoom In">+</button>
                    <button class="zoom-out-btn" title="Zoom Out">−</button>
                    <span class="zoom-level">100%</span>
                    <div class="image-nav-controls">
                        <button class="prev-image-btn" title="Previous Image">‹</button>
                        <span class="image-counter">1 / 1</span>
                        <button class="next-image-btn" title="Next Image">›</button>
                    </div>
                </div>
                <div class="image-modal-container">
                    <img id="modalImage" src="" alt="Expanded image" />
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.image-modal-close');
    const zoomInBtn = document.querySelector('.zoom-in-btn');
    const zoomOutBtn = document.querySelector('.zoom-out-btn');
    const zoomLevel = document.querySelector('.zoom-level');
    const container = document.querySelector('.image-modal-container');
    const prevBtn = document.querySelector('.prev-image-btn');
    const nextBtn = document.querySelector('.next-image-btn');
    const imageCounter = document.querySelector('.image-counter');
    
    let currentZoom = 100;
    const minZoom = 50;
    const maxZoom = 300;
    let currentSectionId = null;
    let currentImageIndex = 0;
    
    // Image placeholder click handler
    document.addEventListener('click', (e) => {
        if (e.target.closest('.image-placeholder')) {
            const placeholder = e.target.closest('.image-placeholder');
            currentSectionId = placeholder.dataset.sectionId;
            currentImageIndex = 0;
            
            // Load the image
            loadImage();
            modal.classList.add('active');
            currentZoom = 100;
            updateZoom();
        }
    });
    
    function loadImage() {
        if (!currentSectionId || !sectionImages[currentSectionId]) return;
        
        const images = sectionImages[currentSectionId];
        const imagePath = images[currentImageIndex];
        
        // Load the actual image file
        modalImage.src = imagePath;
        
        // Update counter
        imageCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
        
        // Update button states
        prevBtn.disabled = currentImageIndex === 0;
        nextBtn.disabled = currentImageIndex === images.length - 1;
    }
    
    // Navigation buttons
    prevBtn.addEventListener('click', () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            loadImage();
            currentZoom = 100;
            updateZoom();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        const images = sectionImages[currentSectionId];
        if (currentImageIndex < images.length - 1) {
            currentImageIndex++;
            loadImage();
            currentZoom = 100;
            updateZoom();
        }
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        currentZoom = 100;
        updateZoom();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            currentZoom = 100;
            updateZoom();
        }
    });
    
    // Zoom controls
    zoomInBtn.addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + 10, maxZoom);
        updateZoom();
    });
    
    zoomOutBtn.addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - 10, minZoom);
        updateZoom();
    });
    
    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            currentZoom = Math.min(currentZoom + 10, maxZoom);
        } else {
            currentZoom = Math.max(currentZoom - 10, minZoom);
        }
        updateZoom();
    }, { passive: false });
    
    // Drag functionality for zoomed images
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let offsetX = 0;
    let offsetY = 0;
    
    modalImage.addEventListener('mousedown', (e) => {
        if (currentZoom > 100) {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            modalImage.style.cursor = 'grabbing';
        }
    });
    
    const handleMouseMove = (e) => {
        if (isDragging && currentZoom > 100) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            
            offsetX += deltaX;
            offsetY += deltaY;
            
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            
            updateImagePosition();
        }
    };
    
    const handleMouseUp = () => {
        isDragging = false;
        modalImage.style.cursor = 'grab';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    
    modalImage.addEventListener('mousedown', (e) => {
        if (currentZoom > 100) {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            modalImage.style.cursor = 'grabbing';
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    });
    
    function updateZoom() {
        modalImage.style.transform = `scale(${currentZoom / 100}) translate(${offsetX}px, ${offsetY}px)`;
        zoomLevel.textContent = `${currentZoom}%`;
    }
    
    function updateImagePosition() {
        modalImage.style.transform = `scale(${currentZoom / 100}) translate(${offsetX}px, ${offsetY}px)`;
    }
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Menu
    DOM.hamburger.addEventListener('click', openMenu);
    DOM.closeBtn.addEventListener('click', closeMenu);
    DOM.navMenu.addEventListener('click', (e) => {
        if (e.target === DOM.navMenu) closeMenu();
    });
    DOM.navLinks.addEventListener('click', handleNavClick);

    // Scroll
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', () => window.scrollTo(0, 0));

    // Touch
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Keyboard
    document.addEventListener('keydown', handleKeyDown);

    // Resize
    window.addEventListener('resize', handleResize);

    // Mouse tracking for thank you page
    setupMouseTracking();
    
    // Image modal
    setupImageModal();
}

// ===== UTILITY FUNCTIONS =====
function fadeInPage() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s';
        document.body.style.opacity = '1';
    }, 100);
}

// ===== START APPLICATION =====
window.addEventListener('load', init);
