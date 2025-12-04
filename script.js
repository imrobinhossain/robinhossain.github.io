console.log('script.js loaded');

// Track preloader start time from when script loads
const preloaderStartTime = Date.now();
console.log('Preloader tracking started at:', preloaderStartTime);

/* Sticky header accent color sampler
   - Samples the page background (prefers .particle-background if present)
   - Extracts a representative color from gradients or solid backgrounds
   - Updates the existing .sticky-header element's CSS variables:
       --sticky-accent-rgb
   - Smoothly transitions via the CSS transitions added to .sticky-header
   This script does NOT create any new CSS classes; it only updates variables
   on the existing `.sticky-header` element. */
(function(){
    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }

    function parseRgbString(str) {
        const m = str.match(/rgba?\s*\(([^)]+)\)/i);
        if (!m) return null;
        const parts = m[1].split(',').map(p=>p.trim());
        return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
    }

    function extractColorsFromCss(bg) {
        if (!bg) return null;
        // Try to find rgb(...) or rgba(...)
        const rgbMatch = bg.match(/rgba?\([^)]*\)/gi);
        if (rgbMatch && rgbMatch.length) {
            return rgbMatch.map(s => parseRgbString(s)).filter(Boolean);
        }
        // Try to find hex colors
        const hexMatch = bg.match(/#([0-9a-fA-F]{3,6})/g);
        if (hexMatch && hexMatch.length) {
            return hexMatch.map(h => hexToRgb(h));
        }
        return null;
    }

    function applyAccent(rgb) {
        if (!rgb) return;
        const el = document.querySelector('.sticky-header');
        if (!el) return;
        const value = `${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}`;
        el.style.setProperty('--sticky-accent-rgb', value);
    }

    function sampleBackground() {
        try {
            const preferred = document.querySelector('.particle-background') || document.body;
            const cs = window.getComputedStyle(preferred);
            const bg = cs.backgroundImage || cs.background || cs.backgroundColor || '';
            const colors = extractColorsFromCss(bg);
            if (colors && colors.length) {
                // pick a middle color if gradient, otherwise first
                const pick = colors[Math.floor(colors.length / 2)];
                applyAccent(pick);
                return;
            }

            // fallback: if no usable css color, try reading body computed background-color
            const bodyBg = window.getComputedStyle(document.body).backgroundColor;
            const parsed = parseRgbString(bodyBg);
            if (parsed) applyAccent(parsed);
        } catch (e) {
            console.warn('Sticky accent sampler error:', e);
        }
    }

    function debounce(fn, wait){ let t; return function(){ clearTimeout(t); t=setTimeout(()=>fn(), wait);} }

    document.addEventListener('DOMContentLoaded', function(){
        // initial sample
        sampleBackground();

        // re-sample when the document's class/style attributes change
        const observer = new MutationObserver(debounce(sampleBackground, 220));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class','style'] });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class','style'] });

        // also resample on resize (background gradients might be responsive)
        window.addEventListener('resize', debounce(sampleBackground, 200));
    });
})();

// PRELOADER PAUSED - Hide scrollbar immediately when script loads
// if (document.body) {
//     document.body.classList.add('preloader-active');
// } else {
//     document.addEventListener('DOMContentLoaded', function() {
//         document.body.classList.add('preloader-active');
//     });
// }

// Global Variables
let isMenuOpen = false;
let skillsAnimated = false;
let mouse = { x: 0, y: 0 };

// Profile Image Flip Card Variables
let profileFlipTimer = null;
let isInAboutSection = false;
let aboutSectionStartTime = null;

// --- HERO PARTICLE SYSTEM ---
let heroParticles = [];

// --- BACKGROUND PARTICLE SYSTEM ---
let backgroundParticles = [];
let backgroundCanvas, backgroundCtx;
let mousePos = { x: null, y: null };

// Interactive Preloader functionality
function initPreloader() {
    const preloader = document.getElementById('preloader');
    const loadingMessage = document.getElementById('loadingMessage');
    const progressBar = document.getElementById('progressBar');
    
    // PRELOADER PAUSED - Add preloader-active class to hide scrollbar
    // document.body.classList.add('preloader-active');
    
    
    
    // Function to trigger bar compression when dot reaches 5th bar
    let barCompressionTriggered = false;
    let lastTriggerTime = 0;
    
    function triggerBarCompression() {
        // Bar compression disabled - bars will not shrink when dot climbs
        return;
    }
    
    // Monitor dot position and trigger bar compression
    let currentBarIndex = -1; // Track which bar the dot is currently on
    let animationStartTime = Date.now();
    
    // Initialize bar colors to ensure consistency across environments
    function initializeBarColors() {
        const bars = document.querySelectorAll('.loader__bar');
        bars.forEach(bar => {
            bar.style.background = '#ffffff';
        });
        currentBarIndex = -1;
    }
    
    // Call initialization immediately
    initializeBarColors();
    
    function monitorDotPosition() {
        const ball = document.querySelector('.loader__ball');
        if (ball) {
            const bars = document.querySelectorAll('.loader__bar');
            const dotColor = '#b6f500'; // Dot color
            const whiteColor = '#ffffff'; // White color for bars
            
            // Calculate animation progress (2.5s cycle)
            const currentTime = Date.now();
            const elapsedTime = (currentTime - animationStartTime) % 2500; // 2.5s cycle
            const progress = (elapsedTime / 2500) * 100; // Progress as percentage
            
            // Determine which bar should be colored based on animation timing
            let newBarIndex = -1;
            
            // Map animation progress to bar positions with more precise timing
            if (progress >= 0 && progress < 16) {
                newBarIndex = 0; // Bar 1 (0% - 16%)
            } else if (progress >= 16 && progress < 34) {
                newBarIndex = 1; // Bar 2 (16% - 34%)
            } else if (progress >= 34 && progress < 52) {
                newBarIndex = 2; // Bar 3 (34% - 52%)
            } else if (progress >= 52 && progress < 70) {
                newBarIndex = 3; // Bar 4 (52% - 70%)
            } else if (progress >= 70 && progress < 100) {
                newBarIndex = 4; // Bar 5 (70% - 100%)
            }
            
            // Enhanced color synchronization for hosted environments
            if (newBarIndex !== -1 && newBarIndex !== currentBarIndex) {
                // Reset all bars to white first for consistency
                bars.forEach((bar, index) => {
                    if (index !== newBarIndex) {
                        bar.style.background = whiteColor;
                    }
                });
                
                // Color the active bar
                if (newBarIndex >= 0 && newBarIndex < bars.length) {
                    bars[newBarIndex].style.background = dotColor;
                }
                
                currentBarIndex = newBarIndex;
            }
            
            // Trigger bar compression at the end of the cycle
            if (progress >= 80 && progress < 85) {
                triggerBarCompression();
            }
        }
    }
    
    // Set up monitoring with higher frequency for better precision and consistency
    setInterval(monitorDotPosition, 30); // Increased frequency for better sync
    
    
    
    // Loading time-based text reveal system
    function showTextBasedOnLoadingTime() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - preloaderStartTime;
        
        // Show loading message after 3 seconds of actual loading
        if (elapsedTime >= 3000 && !loadingMessage.classList.contains('show')) {
            if (loadingMessage) {
                loadingMessage.classList.add('show');
                
                // Animate loading message text line by line
                const messagePart1 = loadingMessage.querySelector('.message-part-1');
                if (messagePart1) {
                    const textLines = messagePart1.querySelectorAll('.text-line');
                    textLines.forEach((line, index) => {
                        const delay = parseFloat(line.getAttribute('data-delay')) * 1000;
                        setTimeout(() => {
                            line.classList.add('show');
                        }, delay);
                    });
                }
                
                // Animate second message after 2 seconds delay
                setTimeout(() => {
                    const messagePart2 = loadingMessage.querySelector('.message-part-2');
                    if (messagePart2) {
                        const blurTextLines = messagePart2.querySelectorAll('.blur-text-line');
                        blurTextLines.forEach((line, index) => {
                            const delay = parseFloat(line.getAttribute('data-delay')) * 1000;
                            setTimeout(() => {
                                line.classList.add('show');
                            }, delay);
                        });
                    }
                }, 2000);
                
                console.log('Loading message shown after', elapsedTime, 'ms of loading');
            }
        }
        
        
        

    }
    
    // Check loading time every 100ms
    const loadingTimeInterval = setInterval(showTextBasedOnLoadingTime, 100);
    

    
    // Progress bar animation
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90; // Don't complete until ready
        
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }, 200);
    
    // Function to check if all resources are loaded
    function checkAllResourcesLoaded() {
        return new Promise((resolve) => {
            console.log('Starting comprehensive resource loading check...');
            
            // Enhanced image loading check for hosted environments
            const images = document.querySelectorAll('img');
            console.log(`Found ${images.length} images to load`);
            const imagePromises = Array.from(images).map(img => {
                return new Promise(resolve => {
                    const imgSrc = img.src || img.alt || 'unnamed';
                    
                    // Check if image is already loaded
                    if (img.complete && img.naturalHeight !== 0 && img.naturalWidth !== 0) {
                        console.log(`Image already loaded: ${imgSrc}`);
                        resolve();
                    } else {
                        console.log(`Waiting for image to load: ${imgSrc}`);
                        
                        // Multiple event listeners for better reliability
                        const imageLoaded = () => {
                            console.log(`Image loaded: ${imgSrc}`);
                            resolve();
                        };
                        
                        img.addEventListener('load', imageLoaded);
                        img.addEventListener('error', () => {
                            console.log(`Image failed to load: ${imgSrc}`);
                            resolve(); // Continue even if image fails
                        });
                        
                        // Force image loading if it hasn't started
                        if (!img.complete) {
                            img.src = img.src; // Trigger loading
                        }
                    }
                });
            });
            
            // Enhanced video loading check for hosted environments
            const videos = document.querySelectorAll('video');
            console.log(`Found ${videos.length} videos to load`);
            const videoPromises = Array.from(videos).map(video => {
                return new Promise(resolve => {
                    const videoSrc = video.querySelector('source')?.src || video.src || 'unnamed';
                    console.log(`Checking video: ${videoSrc}, readyState: ${video.readyState}`);
                    
                    // Enhanced video readiness check for hosted environments
                    const checkVideoReady = () => {
                        console.log(`Video ready: ${videoSrc}, readyState: ${video.readyState}`);
                        resolve();
                    };
                    
                    // Check if video is already loaded enough to play
                    if (video.readyState >= 4) { // HAVE_ENOUGH_DATA - fully loaded
                        console.log(`Video already fully ready: ${videoSrc}`);
                        resolve();
                    } else if (video.readyState >= 3) { // HAVE_FUTURE_DATA - enough data to play
                        console.log(`Video has enough data: ${videoSrc}`);
                        // Wait a bit more for better stability
                        setTimeout(() => {
                            console.log(`Video ready after delay: ${videoSrc}`);
                            resolve();
                        }, 500);
                    } else {
                        console.log(`Waiting for video to be ready: ${videoSrc}`);
                        
                        // Multiple event listeners for better reliability
                        video.addEventListener('canplay', checkVideoReady);
                        video.addEventListener('canplaythrough', checkVideoReady);
                        video.addEventListener('loadeddata', checkVideoReady);
                        video.addEventListener('loadedmetadata', checkVideoReady);
                        video.addEventListener('progress', () => {
                            if (video.readyState >= 3) {
                                console.log(`Video ready via progress: ${videoSrc}`);
                                resolve();
                            }
                        });
                        video.addEventListener('error', () => {
                            console.log(`Video failed to load: ${videoSrc}`);
                            resolve(); // Continue even if video fails
                        });
                        
                        // Force video to start loading if it hasn't already
                        if (video.readyState === 0) {
                            video.load();
                        }
                        
                        // Additional timeout for video loading
                        setTimeout(() => {
                            if (video.readyState >= 2) {
                                console.log(`Video ready via timeout: ${videoSrc}`);
                                resolve();
                            }
                        }, 5000);
                    }
                });
            });
            
            // Check if all external resources are loaded
            const externalResources = [
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
                'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap',
                'https://fonts.googleapis.com/css2?family=Fuzzy+Bubbles:wght@700&display=swap',
                'https://fonts.googleapis.com/css2?family=La+Belle+Aurore&display=swap',
                'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js'
            ];
            
            console.log(`Checking ${externalResources.length} external resources`);
            const resourcePromises = externalResources.map(url => {
                return new Promise(resolve => {
                    console.log(`Checking external resource: ${url}`);
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.href = url;
                    link.onload = () => {
                        console.log(`External resource loaded: ${url}`);
                        resolve();
                    };
                    link.onerror = () => {
                        console.log(`External resource failed: ${url}`);
                        resolve(); // Continue even if resource fails
                    };
                    document.head.appendChild(link);
                });
            });
            
            // Check if all fonts are loaded
            const fontPromises = [];
            if (document.fonts && document.fonts.ready) {
                console.log('Checking font loading...');
                fontPromises.push(
                    document.fonts.ready.then(() => {
                        console.log('All fonts loaded');
                    })
                );
            } else {
                console.log('Font loading API not available, skipping font check');
            }
            
            // Additional checks for hosted environments
            const additionalChecks = [];
            
            // Check if all CSS is loaded
            const styleSheets = Array.from(document.styleSheets);
            console.log(`Found ${styleSheets.length} stylesheets`);
            styleSheets.forEach((sheet, index) => {
                additionalChecks.push(
                    new Promise(resolve => {
                        try {
                            // Try to access CSS rules to ensure stylesheet is loaded
                            const rules = sheet.cssRules || sheet.rules;
                            console.log(`Stylesheet ${index} loaded with ${rules?.length || 0} rules`);
                            resolve();
                        } catch (e) {
                            console.log(`Stylesheet ${index} failed to load, continuing...`);
                            resolve(); // Continue even if stylesheet fails
                        }
                    })
                );
            });
            
            // Check if critical JavaScript is loaded
            additionalChecks.push(
                new Promise(resolve => {
                    // Check if particles.js is loaded
                    if (typeof window.particlesJS !== 'undefined') {
                        console.log('Particles.js loaded');
                        resolve();
                    } else {
                        console.log('Waiting for particles.js...');
                        setTimeout(() => {
                            console.log('Particles.js check complete');
                            resolve();
                        }, 1000);
                    }
                })
            );
            
            // Wait for all resources to load
            Promise.all([...imagePromises, ...videoPromises, ...resourcePromises, ...fontPromises, ...additionalChecks])
                .then(() => {
                    console.log('All resources loaded, waiting additional time for stability...');
                    // Extended delay for hosted environments
                    setTimeout(() => {
                        console.log('Resource loading check complete');
                        resolve();
                    }, 2000);
                });
        });
    }
    
    // Function to complete loading and hide preloader
    function completeLoading() {
        clearInterval(progressInterval);
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        
        
        
        // Hide preloader
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
                // PRELOADER PAUSED - document.body.classList.add('loaded');
                // PRELOADER PAUSED - document.body.classList.remove('preloader-active');
            
                // Removed automatic scroll-to-top on fresh page load to preserve
                // the user's current scroll position after the preloader hides.
            
                // Animate hero content
            setTimeout(() => {
                document.querySelectorAll('.hero-content > *').forEach((el, index) => {
                    el.style.animationDelay = `${index * 0.2}s`;
                    el.classList.add('fade-in');
                });
            }, 100);
        }, 500);
        }, 1000);
    }
    
    // Wait specifically for the hero background video to be ready.
    // This keeps the preloader visible only as long as the hero video needs to load,
    // reducing unnecessary waiting for other resources.
    (function waitForHeroVideoAndLoad() {
        const heroVideo = document.querySelector('.hero-video-background');
        if (!heroVideo) {
            // If no hero video found, fall back to original comprehensive loading check
            Promise.all([
                new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        console.log('Document already fully loaded');
                        resolve();
                    } else {
                        console.log('Waiting for window load event...');
                        window.addEventListener('load', () => {
                            console.log('Window load event fired');
                            resolve();
                        });
                    }
                }),
                checkAllResourcesLoaded()
            ]).then(() => {
                console.log('No hero video: resources loaded, completing preloader');
                completeLoading();
            });
            return;
        }

        // Resolve when the video is ready to play through or has enough data
        const heroReadyPromise = new Promise(resolve => {
            function onReady() {
                cleanup();
                console.log('Hero video ready:', heroVideo.readyState);
                resolve();
            }
            function onError() {
                cleanup();
                console.warn('Hero video failed to load or errored; proceeding');
                resolve();
            }
            function cleanup() {
                heroVideo.removeEventListener('canplaythrough', onReady);
                heroVideo.removeEventListener('canplay', onReady);
                heroVideo.removeEventListener('loadeddata', onReady);
                heroVideo.removeEventListener('loadedmetadata', onReady);
                heroVideo.removeEventListener('error', onError);
            }

            // If already in a good readyState, resolve immediately
            if (heroVideo.readyState >= 3) { // HAVE_FUTURE_DATA or better
                console.log('Hero video already has sufficient data (readyState >= 3)');
                resolve();
                return;
            }

            heroVideo.addEventListener('canplaythrough', onReady, { once: true });
            heroVideo.addEventListener('canplay', onReady, { once: true });
            heroVideo.addEventListener('loadeddata', onReady, { once: true });
            heroVideo.addEventListener('loadedmetadata', onReady, { once: true });
            heroVideo.addEventListener('error', onError, { once: true });

            // Safety timeout: if the video takes too long, proceed after 15s
            setTimeout(() => {
                console.warn('Hero video wait timed out (15s); proceeding');
                cleanup();
                resolve();
            }, 15000);
        });

        // Also wait for the window load event in parallel but prefer video readiness
        const windowLoadPromise = new Promise(resolve => {
            if (document.readyState === 'complete') resolve();
            else window.addEventListener('load', () => resolve(), { once: true });
        });

        Promise.all([heroReadyPromise, windowLoadPromise]).then(() => {
            console.log('Hero video ready and window loaded (or timed out), completing preloader');
            completeLoading();
        });
    })();
    
    // Fallback: Complete loading after maximum 30 seconds for hosted environments
    setTimeout(() => {
        console.log('Fallback: Completing preloader after timeout');
        completeLoading();
    }, 30000);
}

// Initialize preloader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // PRELOADER PAUSED - Commented out for now, can be re-enabled later
    // initPreloader();
    
    // Initialize the preloader flow so it remains until all resources
    // (including the hero background video) are fully ready to play.
    initPreloader();
    
    console.log('particles.js test:', typeof window.particlesJS);
    // Remove the following lines to eliminate the background particle effect only:
    // const networkParticles = new NetworkParticles('networkCanvas');
    // window.networkParticles = networkParticles;
    
    // Optimize for mobile performance
    if (window.innerWidth <= 768) {
        const particleCount = window.innerWidth <= 480 ? 30 : 50;
        initHeroParticles(particleCount);
    } else {
        initHeroParticles();
    }
    
    // Initialize background particles
    initBackgroundParticles();
    
    // Initialize footer circles
    initFooterCircles();
    
    initNavigation();
    initTypewriter();
    initScrollAnimations();
    initContactForm();
    initStickyHeader();
    initProfileImageTransition();
    initScrollToTopButton();
    animateHeroParticles();
    animateBackgroundParticles();
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                // If this is a nav link, update active state and underline immediately
                if (this.classList.contains('nav-link')) {
                    // Remove active from all nav links
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                    });
                    // Add active to clicked link
                    this.classList.add('active');
                    // Update underline immediately (desktop only)
                    if (window.innerWidth > 1024) {
                        updateNavIndicator(this);
                    }
                }
                // Smooth scroll to target with consistent offset (desktop only)
                if (window.innerWidth > 1024) {
                    // Special handling for Home section - scroll to top
                    if (target.id === 'home' || target.classList.contains('hero-section')) {
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    } else {
                        // Calculate navbar height
                        const navbar = document.getElementById('navbar');
                        const navbarHeight = navbar ? navbar.offsetHeight : 70;
                        
                        // Find section title within the target section for consistent spacing
                        const sectionTitle = target.querySelector('.section-title');
                        let targetElement = sectionTitle || target;
                        
                        // Calculate position: section title top + current scroll - navbar height
                        const targetRect = targetElement.getBoundingClientRect();
                        const targetPosition = targetRect.top + window.pageYOffset - navbarHeight;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                } else {
                    // Mobile: use default scrollIntoView
                    if (target.id === 'home' || target.classList.contains('hero-section')) {
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    } else {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }
        });
    });

    // Scroll indicator show/hide logic
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const heroSection = document.querySelector('.hero-section');
    function toggleScrollIndicator() {
        if (!scrollIndicator || !heroSection) return;
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        if (heroBottom <= 0) {
            scrollIndicator.classList.add('scroll-indicator--visible');
        } else {
            scrollIndicator.classList.remove('scroll-indicator--visible');
        }
    }
    window.addEventListener('scroll', toggleScrollIndicator);
    toggleScrollIndicator(); // Initial check

    // Quote Rotator for Favorite Quote section
    const quotes = [
        {
            text: `Every one of us is, in the cosmic perspective, precious. If a human disagrees with you, let him live. In a hundred billion galaxies, you will not find another.`,
            author: 'Carl Sagan'
        },
        {
            text: `If you're brave enough to say goodbye, life will reward you with a new hello.`,
            author: 'Paulo Coelho'
        },
        {
            text: `Nothing is impossible. Because 'impossible' says that "I-m-possible.`,
            author: 'Audrey Hepburn'
        },
        {
            text: `What are you afraid of losing when nothing in the world actually belongs to you?`,
            author: 'Marcus Aurelius'
        },
        {
            text: `Everything that happens helps you grow, even if it’s hard to see right now.`,
            author: 'Austin Mahone'
        }
    ];
    const quoteText = document.querySelector('.quote-text');
    const authorName = document.querySelector('.author-name');
    let quoteIndex = 0;
    function showQuote(index) {
        if (!quoteText || !authorName) return;
        // Fade out
        quoteText.style.transition = 'opacity 0.7s';
        authorName.style.transition = 'opacity 0.7s';
        quoteText.style.opacity = 0;
        authorName.style.opacity = 0;
        setTimeout(() => {
            quoteText.textContent = '"' + quotes[index].text + '"';
            authorName.textContent = quotes[index].author;
            // Add/remove special class for Carl Sagan quote (index 0) so we
            // can apply a different mobile-only rule for that one quote.
            if (index === 0) {
                quoteText.classList.add('quote--sagan');
            } else {
                quoteText.classList.remove('quote--sagan');
            }
            // Fade in
            quoteText.style.opacity = 1;
            authorName.style.opacity = 1;
        }, 700);
    }
    setInterval(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        showQuote(quoteIndex);
    }, 10000);
    // Initialize with the first quote (which matches the HTML)
    showQuote(0);

    // Sticky navbar scroll effect
    const navbar = document.getElementById('navbar');
    function handleNavbarScroll() {
        if (!navbar) return;
        if (window.scrollY > 0) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', handleNavbarScroll);
    handleNavbarScroll(); // Initial check

    // Initialize desktop nav underline indicator
    updateNavIndicator();
    window.addEventListener('resize', debounce(updateNavIndicator, 150));
    window.addEventListener('load', updateNavIndicator);
    // Real-time sync on scroll using rAF (desktop only)
    let navIndicatorRafPending = false;
    function scheduleNavIndicatorUpdate() {
        if (navIndicatorRafPending) return;
        navIndicatorRafPending = true;
        requestAnimationFrame(() => {
            navIndicatorRafPending = false;
            // Skip scroll-driven updates while a desktop click lock is active
            if (window.innerWidth > 1024) {
                if (Date.now() < __navIndicatorLockUntil) return;
                updateNavIndicator();
            }
        });
    }
    window.addEventListener('scroll', scheduleNavIndicatorUpdate, { passive: true });
    // Move indicator on desktop nav clicks immediately
    const desktopNavLinks = document.querySelectorAll('#navbar .nav-container .nav-links .nav-link');
    desktopNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth > 1024) {
                // Lock indicator to the clicked link to prevent bounce-back during smooth scroll
                __navIndicatorLockUntil = Date.now() + 900;
                __desktopLastActiveLink = this;
                updateNavIndicator(this);
            }
        });
    });

      
});

function initStickyHeader() {
    const navbar = document.getElementById('navbar');
    const navLogo = document.querySelector('.nav-logo');
    if (!navbar || !navLogo) return;
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            navLogo.classList.add('wave-active');
            navbar.style.background = 'rgba(17, 24, 39, 0.98)';
            navbar.style.borderBottom = '2px solid var(--accent-purple)';
        } else {
            navLogo.classList.remove('wave-active');
            navbar.style.background = 'rgba(17, 24, 39, 0.9)';
            navbar.style.borderBottom = '1px solid var(--border-color)';
        }
    });
}

// Hero Particle Class
class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.8 + 0.2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off edges
        if (this.x <= 0 || this.x >= this.canvas.width) this.vx *= -1;
        if (this.y <= 0 || this.y >= this.canvas.height) this.vy *= -1;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function initHeroParticles(particleCount = 30) {
    const canvas = document.getElementById('heroParticleCanvas');
    const heroContent = document.querySelector('.hero-content');
    if (!canvas || !heroContent) return;
    function resizeCanvas() {
        canvas.width = heroContent.clientWidth;
        canvas.height = heroContent.clientHeight;
        heroParticles = [];
        for (let i = 0; i < particleCount; i++) {
            heroParticles.push(new Particle(canvas));
        }
    }
    resizeCanvas();
    window.addEventListener('resize', debounce(resizeCanvas, 250));
}

function animateHeroParticles() {
    const canvas = document.getElementById('heroParticleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Draw connecting lines
    for (let i = 0; i < heroParticles.length; i++) {
        for (let j = i + 1; j < heroParticles.length; j++) {
            const dx = heroParticles[i].x - heroParticles[j].x;
            const dy = heroParticles[i].y - heroParticles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
                ctx.save();
                ctx.globalAlpha = 0.22 * (1 - distance / 100);
                ctx.beginPath();
                ctx.moveTo(heroParticles[i].x, heroParticles[i].y);
                ctx.lineTo(heroParticles[j].x, heroParticles[j].y);
                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = 1.1;
                ctx.stroke();
                ctx.restore();
            }
        }
    }
    for (let i = 0; i < heroParticles.length; i++) {
        heroParticles[i].update();
        heroParticles[i].draw(ctx);
    }
    requestAnimationFrame(animateHeroParticles);
}

// Background Particle System
function initBackgroundParticles() {
    backgroundCanvas = document.getElementById('particleBackground');
    if (!backgroundCanvas) return;
    
    backgroundCtx = backgroundCanvas.getContext('2d');
    if (!backgroundCtx) return;
    
    function resizeBackgroundCanvas() {
        backgroundCanvas.width = window.innerWidth;
        backgroundCanvas.height = window.innerHeight;
        
        // Clear existing particles
        backgroundParticles = [];
        
        // Create particles based on screen size
        const particleCount = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 18000));
        
        for (let i = 0; i < particleCount; i++) {
            backgroundParticles.push(new BackgroundParticle(backgroundCanvas));
        }
    }
    
    resizeBackgroundCanvas();
    window.addEventListener('resize', debounce(resizeBackgroundCanvas, 250));
}

function animateBackgroundParticles() {
    if (!backgroundCanvas || !backgroundCtx) return;
    
    // Check if we're in footer section and hide particles if so
    const footer = document.querySelector('.footer');
    if (footer) {
        const footerTop = footer.offsetTop;
        const footerBottom = footerTop + footer.offsetHeight;
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const windowMiddle = scrollPosition + (windowHeight / 2);
        
        // If in footer section, hide the entire canvas element
        if (windowMiddle >= footerTop && windowMiddle <= footerBottom) {
            backgroundCanvas.style.opacity = '0';
            backgroundCanvas.style.visibility = 'hidden';
            requestAnimationFrame(animateBackgroundParticles);
            return;
        } else {
            // Show the canvas when not in footer
            backgroundCanvas.style.opacity = '1';
            backgroundCanvas.style.visibility = 'visible';
        }
    }
    
    const w = backgroundCanvas.width;
    const h = backgroundCanvas.height;
    backgroundCtx.clearRect(0, 0, w, h);
    // Draw connecting lines between particles
    for (let i = 0; i < backgroundParticles.length; i++) {
        for (let j = i + 1; j < backgroundParticles.length; j++) {
            const dx = backgroundParticles[i].x - backgroundParticles[j].x;
            const dy = backgroundParticles[i].y - backgroundParticles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 90) {
                backgroundCtx.save();
                backgroundCtx.globalAlpha = 0.13 * (1 - distance / 90);
                backgroundCtx.beginPath();
                backgroundCtx.moveTo(backgroundParticles[i].x, backgroundParticles[i].y);
                backgroundCtx.lineTo(backgroundParticles[j].x, backgroundParticles[j].y);
                backgroundCtx.strokeStyle = '#8b5cf6';
                backgroundCtx.lineWidth = 1.1;
                backgroundCtx.stroke();
                backgroundCtx.restore();
            }
        }
    }
    // Draw lines to mouse on hover
    if (mousePos.x !== null && mousePos.y !== null) {
        for (let i = 0; i < backgroundParticles.length; i++) {
            const dx = backgroundParticles[i].x - mousePos.x;
            const dy = backgroundParticles[i].y - mousePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
                backgroundCtx.save();
                backgroundCtx.globalAlpha = 0.18 * (1 - distance / 120);
                backgroundCtx.beginPath();
                backgroundCtx.moveTo(backgroundParticles[i].x, backgroundParticles[i].y);
                backgroundCtx.lineTo(mousePos.x, mousePos.y);
                backgroundCtx.strokeStyle = '#8b5cf6';
                backgroundCtx.lineWidth = 1.2;
                backgroundCtx.stroke();
                backgroundCtx.restore();
            }
        }
    }
    // Draw particles
    for (let i = 0; i < backgroundParticles.length; i++) {
        backgroundParticles[i].update();
        backgroundParticles[i].draw(backgroundCtx);
    }
    requestAnimationFrame(animateBackgroundParticles);
}

// Mouse tracking for background canvas
if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', function(e) {
        if (!backgroundCanvas) return;
        const rect = backgroundCanvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    });
    window.addEventListener('mouseleave', function() {
        mousePos.x = null;
        mousePos.y = null;
    });
}

// Background Particle Class
class BackgroundParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // Always have a base velocity for natural movement
        this.baseVx = (Math.random() - 0.5) * 0.3;
        this.baseVy = (Math.random() - 0.5) * 0.3;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        this.size = Math.random() * 1.5 + 0.7;
        this.opacity = Math.random() * 0.3 + 0.1;
    }
    update() {
        // Only natural movement
        this.vx += (this.baseVx - this.vx) * 0.01;
        this.vy += (this.baseVy - this.vy) * 0.01;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        if (this.x < 0) this.x = this.canvas.width;
        if (this.x > this.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.canvas.height;
        if (this.y > this.canvas.height) this.y = 0;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function initNavigation() {
    const hamburger = document.querySelector('.nav-hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Ensure mobile menu starts closed
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });
        
        document.querySelectorAll('.mobile-menu .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                isMenuOpen = false;
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }
    window.addEventListener('scroll', () => {
        const sections = ['home', 'about', 'experience', 'education', 'skills', 'projects', 'portfolio', 'contact'];
        let current = '';
        
        // Desktop-only: Use navbar height for consistent detection (matches click event trigger point)
        const isDesktop = window.innerWidth > 1024;
        const navbar = document.getElementById('navbar');
        const navbarHeight = isDesktop && navbar ? navbar.offsetHeight : 70;
        const thresholdY = navbarHeight; // desktop detection line aligned with click offset
        const scrollThreshold = isDesktop ? thresholdY : 100; // Desktop: use thresholdY, Mobile: use 100px
        
        // While a desktop click lock is active, skip scroll-driven nav updates to prevent bounce
        if (isDesktop && Date.now() < __navIndicatorLockUntil) {
            return;
        }
        
        // Desktop: Viewport-based detection with early exact detection-line match (aligned with click offset)
        if (isDesktop) {
            // Special handling for Home - if at top of page, always Home
            if (window.pageYOffset <= 50) {
                current = 'home';
            } else {
                const viewportTop = navbarHeight;
                const viewportBottom = window.innerHeight;
                const viewportMiddle = viewportTop + (viewportBottom - viewportTop) / 2;
                
                // Define all sections with their associated subsections
                const sectionGroups = [
                    {
                        id: 'home',
                        main: document.getElementById('home'),
                        subsections: []
                    },
                    {
                        id: 'about',
                        main: document.getElementById('about'),
                        subsections: [document.querySelector('.stats-section')]
                    },
                    {
                        id: 'experience',
                        main: document.getElementById('experience'),
                        subsections: [document.getElementById('experience')?.querySelector('.container')?.querySelector('.achievements-section')]
                    },
                    {
                        id: 'education',
                        main: document.getElementById('education'),
                        subsections: []
                    },
                    {
                        id: 'skills',
                        main: document.getElementById('skills'),
                        subsections: [
                            document.getElementById('other-skills'),
                            document.getElementById('language-proficiency')
                        ]
                    },
                    {
                        id: 'projects',
                        main: document.getElementById('projects'),
                        subsections: []
                    },
                    {
                        id: 'portfolio',
                        main: document.getElementById('portfolio'),
                        subsections: [document.getElementById('about-myself')]
                    },
                    {
                        id: 'contact',
                        main: document.getElementById('contact'),
                        subsections: [
                            document.getElementById('quote'),
                            document.querySelector('.footer')
                        ]
                    }
                ];
                
                // EARLY CHECK: Use single detection line equal to navbar bottom (matches click offset)
                const detectionY = thresholdY;
                for (const group of sectionGroups) {
                    if (!group.main) continue;
                    const rect = group.main.getBoundingClientRect();
                    if (rect.top <= detectionY && rect.bottom > detectionY) {
                        current = group.id;
                        break;
                    }
                }
                if (!current) {
                    for (const group of sectionGroups) {
                        for (const sub of group.subsections) {
                            if (!sub) continue;
                            const rect = sub.getBoundingClientRect();
                            if (rect.top <= detectionY && rect.bottom > detectionY) {
                                current = group.id;
                                break;
                            }
                        }
                        if (current) break;
                    }
                }
                
                // Fallback: choose closest section relative to detection line to avoid jitter
                if (!current) {
                    let bestAbove = null; // latest section whose top is at/above the line
                    let bestAboveTop = -Infinity;
                    let bestBelow = null; // earliest section below the line
                    let bestBelowTop = Infinity;
                    
                    for (const group of sectionGroups) {
                        if (!group.main) continue;
                        const rect = group.main.getBoundingClientRect();
                        if (rect.top <= detectionY) {
                            if (rect.top > bestAboveTop) {
                                bestAboveTop = rect.top;
                                bestAbove = group.id;
                            }
                        } else {
                            if (rect.top < bestBelowTop) {
                                bestBelowTop = rect.top;
                                bestBelow = group.id;
                            }
                        }
                        // evaluate subsections similarly
                        for (const sub of group.subsections) {
                            if (!sub) continue;
                            const srect = sub.getBoundingClientRect();
                            if (srect.top <= detectionY) {
                                if (srect.top > bestAboveTop) {
                                    bestAboveTop = srect.top;
                                    bestAbove = group.id;
                                }
                            } else {
                                if (srect.top < bestBelowTop) {
                                    bestBelowTop = srect.top;
                                    bestBelow = group.id;
                                }
                            }
                        }
                    }
                    current = bestAbove || bestBelow || 'home';
                }
            }
        } else {
            // Mobile: Use original logic
            // Check all main sections and subsections
            // Hero section → Home
            const homeSection = document.getElementById('home');
            if (homeSection) {
                // If at the very top of the page, set Home as active
                if (window.pageYOffset <= 50) {
                    current = 'home';
                } else {
                    const rect = homeSection.getBoundingClientRect();
                    if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                        current = 'home';
                    }
                }
            }
            
            // About section + Stats section → About
            const aboutSection = document.getElementById('about');
            const statsSection = document.querySelector('.stats-section');
            let isInAbout = false;
            if (aboutSection) {
                const rect = aboutSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    isInAbout = true;
                    current = 'about';
                }
            }
            if (statsSection && !isInAbout) {
                const rect = statsSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'about';
                }
            }
            
            // Experience section + Here's What I'm Doing → Experience
            const experienceSection = document.getElementById('experience');
            const experienceContainer = experienceSection ? experienceSection.querySelector('.container') : null;
            const heresWhatImDoingSection = experienceContainer ? experienceContainer.querySelector('.achievements-section') : null;
            let isInExperience = false;
            if (experienceSection) {
                const rect = experienceSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    isInExperience = true;
                    current = 'experience';
                }
            }
            if (heresWhatImDoingSection && !isInExperience) {
                const rect = heresWhatImDoingSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'experience';
                }
            }
            
            // Education section → Education
            const educationSection = document.getElementById('education');
            if (educationSection) {
                const rect = educationSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'education';
                }
            }
            
            // Skills section + Other Skills + Language Proficiency → Skills
            const skillsSection = document.getElementById('skills');
            const otherSkillsSection = document.getElementById('other-skills');
            const languageProficiencySection = document.getElementById('language-proficiency');
            let isInSkills = false;
            if (skillsSection) {
                const rect = skillsSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    isInSkills = true;
                    current = 'skills';
                }
            }
            if (otherSkillsSection && !isInSkills) {
                const rect = otherSkillsSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'skills';
                }
            }
            if (languageProficiencySection && !isInSkills) {
                const rect = languageProficiencySection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'skills';
                }
            }
            
            // Projects section → Projects
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                const rect = projectsSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'projects';
                }
            }
            
            // Portfolio section + About Myself → Portfolio
            const portfolioSection = document.getElementById('portfolio');
            const aboutMyselfSection = document.getElementById('about-myself');
            let isInPortfolio = false;
            if (portfolioSection) {
                const rect = portfolioSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    isInPortfolio = true;
                    current = 'portfolio';
                }
            }
            if (aboutMyselfSection && !isInPortfolio) {
                const rect = aboutMyselfSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'portfolio';
                }
            }
            
            // Contact section + Favorite Quotes + Footer → Contact
            const contactSection = document.getElementById('contact');
            const favoriteQuotesSection = document.getElementById('quote');
            const footerSection = document.querySelector('.footer');
            let isInContact = false;
            if (contactSection) {
                const rect = contactSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    isInContact = true;
                    current = 'contact';
                }
            }
            if (favoriteQuotesSection && !isInContact) {
                const rect = favoriteQuotesSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'contact';
                }
            }
            if (footerSection && !isInContact) {
                const rect = footerSection.getBoundingClientRect();
                if (rect.top <= scrollThreshold && rect.bottom >= scrollThreshold) {
                    current = 'contact';
                }
            }
        }
        
        // Always update active class to match indicator position (desktop: ensure sync)
        // Ensure current is always set on desktop (fallback to home)
        if (isDesktop && !current) {
            current = 'home';
        }
        
        if (current) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
            
            // Update desktop underline position immediately after setting active class
            // (classList operations are synchronous, so DOM is updated immediately)
            if (isDesktop) {
                updateNavIndicator();
            }
        }
    });
}

function initTypewriter() {
    const typewriterElement = document.getElementById('typewriter');
    const texts = ['Junior Officer', 'IT Support Specialist', 'Cybersecurity Enthusiast', 'IoT-savvy', 'Problem Solver'];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeDelay = 100;
    function typeWriter() {
        const currentText = texts[textIndex];
        if (isDeleting) {
            typewriterElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typeDelay = 50;
        } else {
            typewriterElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typeDelay = 100;
        }
        if (!isDeleting && charIndex === currentText.length) {
            typeDelay = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeDelay = 500;
        }
        setTimeout(typeWriter, typeDelay);
    }
    setTimeout(typeWriter, 1000);
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                if (entry.target.id === 'skills' && !skillsAnimated) {
                    animateSkills();
                    skillsAnimated = true;
                }
                if (entry.target.id === 'language-proficiency') {
                    animateLanguageProficiency();
                }
            }
        });
    }, observerOptions);
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
    document.querySelectorAll('.skill-card, .project-card, .stat-card, .achievements-card, .education-card, .timeline-item').forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
}

function animateSkills() {
    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach((card, index) => {
        setTimeout(() => {
            const level = card.dataset.level;
            const progressBar = card.querySelector('.skill-progress');
            const skillLevel = card.querySelector('.skill-level');
            if (progressBar) {
                let percentage;
                // Get the specific skill name to set exact percentages
                const skillName = card.dataset.skill;
                
                switch(skillName) {
                    case 'HTML5': percentage = 97; break;
                    case 'JavaScript': percentage = 85; break;
                    case 'CSS': percentage = 88; break;
                    case 'C++': percentage = 73; break;
                    case 'Python': percentage =67; break;
                    case 'Java': percentage = 45; break;
                    default: 
                        // Fallback to level-based percentages if skill not found
                        switch(level) {
                            case 'basic': percentage = 35; break;
                            case 'intermediate': percentage = 70; break;
                            case 'advanced': percentage = 95; break;
                            default: percentage = 50;
                        }
                        break;
                }
                progressBar.style.width = `${percentage}%`;
            }
            if (skillLevel) {
                skillLevel.classList.add('animate');
            }
        }, index * 300);
    });
}

// Language Proficiency Animation (simplified - no water effects)
function animateLanguageProficiency() {
    const languageCircles = document.querySelectorAll('.language-circle');
    languageCircles.forEach((circle, index) => {
        setTimeout(() => {
            // Add animate class to trigger any remaining CSS animations
            circle.classList.add('animate');
        }, index * 500); // Stagger animations by 500ms
    });
}

function initContactForm() {
    const form = document.getElementById('contactForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Contact form submitted');
        emailjs.sendForm('service_ufqaqrp', 'template_dd14uz8', this)
            .then(function() {
                console.log('EmailJS: Success');
                showToast('Message sent successfully!');
        form.reset();
            }, function(error) {
                console.log('EmailJS: Failed', error);
                showToast('Failed to send message. Please try again.');
            });
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const messageElement = toast.querySelector('.toast-message');
    messageElement.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.project-card, .achievements-card, .education-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02) translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translateY(0)';
        });
    });
    
    // Call animateSkills to start the progress bar animations
    animateSkills();
    
    // Progress Bars Animation on Scroll
    const progressFills = document.querySelectorAll('.progress-fill');
    if (progressFills.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressFill = entry.target;
                    const percentage = progressFill.getAttribute('data-percentage');
                    progressFill.style.setProperty('--target-width', `${percentage}%`);
                    
                    // Set the CSS custom property on the progress bar container for callout positioning
                    const progressBar = progressFill.closest('.progress-bar');
                    if (progressBar) {
                        progressBar.style.setProperty('--target-width', `${percentage}%`);
                    }
                    
                    progressFill.classList.add('animate');
                }
            });
        }, { threshold: 0.5 });
        
        progressFills.forEach(progressFill => {
            observer.observe(progressFill);
        });
    }
});

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.1}px)`;
    }
});

// Utility: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility: Should Reduce Motion
function shouldReduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || 
           window.innerWidth <= 480;
}

// Profile Image Transition (stub for compatibility)
function initScrollToTopButton() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollToTopBtn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });
    
    // Smooth scroll to top when button is clicked
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initProfileImageTransition() {}

// Mobile menu functionality is handled in initNavigation() function

// Flip Card Animation Logic
(function() {
  const flipCard = document.querySelector('.flip-card');
  if (!flipCard) return;
  let isFlipped = false;
  let flipInterval;
  let hoverPaused = false;

  function flip() {
    if (!hoverPaused) {
      isFlipped = !isFlipped;
      flipCard.classList.toggle('flipping', isFlipped);
    }
  }

  function startFlipping() {
    flipInterval = setInterval(flip, 15000);
  }

  function stopFlipping() {
    clearInterval(flipInterval);
  }

  // Start flipping automatically
  startFlipping();

  // Pause on hover
  flipCard.addEventListener('mouseenter', function() {
    hoverPaused = true;
    stopFlipping();
  });
  flipCard.addEventListener('mouseleave', function() {
    hoverPaused = false;
    startFlipping();
  });

  // Ensure the card flips back to front after 10s
  setInterval(function() {
    if (!hoverPaused && isFlipped) {
      isFlipped = false;
      flipCard.classList.remove('flipping');
    }
  }, 20000);
})();

// Ensure particles.js is loaded and initialize as soon as possible
function initParticlesNetwork() {
    if (typeof window.particlesJS !== 'function') {
        console.error('particles.js is not loaded!');
        return;
    }
    particlesJS('particles-js', {
        particles: {
            number: { value: 90, density: { enable: true, value_area: 900 } },
            color: { value: '#a78bfa' },
            shape: { type: 'circle' },
            opacity: { value: 0.11, random: false },
            size: { value: 3.5, random: false },
            line_linked: {
                enable: true,
                distance: 100,
                color: '#a78bfa',
                opacity: 0.45,
                width: 2.2
            },
            move: {
                enable: true,
                speed: 0.4,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'window',
            events: {
                onhover: { enable: true, mode: 'repulse' },
                onclick: { enable: false },
                resize: true
            },
            modes: {
                repulse: { distance: 70, duration: 1.2 }
            }
        },
        retina_detect: true
    });
}

// Try to initialize particles.js as soon as the script is loaded
if (document.getElementById('particles-js')) {
    if (typeof window.particlesJS === 'function') {
        initParticlesNetwork();
    } else {
        // Wait for the CDN to load if not yet available
        let tries = 0;
        const tryInit = setInterval(() => {
            if (typeof window.particlesJS === 'function') {
                clearInterval(tryInit);
                initParticlesNetwork();
            } else if (++tries > 20) {
                clearInterval(tryInit);
                console.error('particles.js failed to load after waiting.');
            }
        }, 200);
    }
}

document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  console.log('Manual handler: Contact form submitted');
});

// Navigation indicator functionality
// Keep a persistent reference for desktop so the underline never disappears
let __desktopLastActiveLink = null;
let __navIndicatorLockUntil = 0; // desktop-only: lock scroll-driven updates briefly after clicks
function updateNavIndicator(targetLink) {
  try {
    if (window.innerWidth <= 1024) return; // desktop only
    const container = document.querySelector('#navbar .nav-container .nav-links');
    if (!container) return;
    let activeLink = targetLink || container.querySelector('.nav-link.active');

    // If no active link resolved (edge thresholds during scroll), fall back to last known
    if (!activeLink) {
      if (!__desktopLastActiveLink || !document.body.contains(__desktopLastActiveLink)) {
        // Fallback to the first nav link (usually Home) to keep indicator visible
        __desktopLastActiveLink = container.querySelector('.nav-link');
      }
      activeLink = __desktopLastActiveLink;
    }

    // At this point we must have an element to point at
    if (!activeLink) return;

    // Persist last known for future gaps
    __desktopLastActiveLink = activeLink;

    const cRect = container.getBoundingClientRect();
    const aRect = activeLink.getBoundingClientRect();
    const left = aRect.left - cRect.left;
    const width = aRect.width;
    container.style.setProperty('--nav-indicator-left', left + 'px');
    container.style.setProperty('--nav-indicator-width', width + 'px');
    // Ensure always visible on desktop
    container.style.setProperty('--nav-indicator-opacity', '1');
  } catch (e) {
    // Fail-safe: keep indicator visible at last known position if possible
    const container = document.querySelector('#navbar .nav-container .nav-links');
    if (container && __desktopLastActiveLink) {
      const cRect = container.getBoundingClientRect();
      const aRect = __desktopLastActiveLink.getBoundingClientRect();
      const left = aRect.left - cRect.left;
      const width = aRect.width;
      container.style.setProperty('--nav-indicator-left', left + 'px');
      container.style.setProperty('--nav-indicator-width', width + 'px');
      container.style.setProperty('--nav-indicator-opacity', '1');
    }
  }
}

// Progressive Scroll Sidebar (Bar Expands Top to Bottom)
window.addEventListener('scroll', function() {
  const scrollBarBg = document.querySelector('.scroll-bar-bg');
  const scrollBarProgress = document.getElementById('scrollBarProgress');
  const navbarScrollPercent = document.getElementById('navbarScrollPercent');
  if (!scrollBarBg || !scrollBarProgress || !navbarScrollPercent) return;
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  
  // Calculate hero section percentage
  const heroSection = document.querySelector('.hero-section');
  const heroHeight = heroSection ? heroSection.offsetHeight : 0;
  const totalPageHeight = document.documentElement.scrollHeight;
  const heroPercentage = Math.round((heroHeight / totalPageHeight) * 100);
  
  // Log hero section percentage (temporary for user to see)
  if (scrollTop === 0) {
    console.log(`Hero section height: ${heroHeight}px`);
    console.log(`Total page height: ${totalPageHeight}px`);
    console.log(`Hero section percentage: ${heroPercentage}%`);
  }
  
  const percent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
  const finalPercent = Math.max(4, percent);
  
  navbarScrollPercent.textContent = finalPercent + '%';
  // Set progress bar height (from top down) for desktop
  const barHeight = scrollBarBg.offsetHeight;
  const progressHeight = Math.max(0, Math.min(100, finalPercent)) * barHeight / 100;
  scrollBarProgress.style.height = progressHeight + 'px';
  scrollBarProgress.style.top = '0';
  
  // Mobile horizontal progress bar
  if (window.innerWidth <= 768) {
    const barWidth = scrollBarBg.offsetWidth;
    const progressWidth = Math.max(0, Math.min(100, finalPercent)) * barWidth / 100;
    scrollBarProgress.style.width = progressWidth + 'px';
    scrollBarProgress.style.height = '100%';
    scrollBarProgress.style.left = '0';
    scrollBarProgress.style.top = '0';
  }

  // Move percentage indicator to the edge of the moving side of the scroll bar
  const barRect = scrollBarBg.getBoundingClientRect();
  const labelHeight = navbarScrollPercent.offsetHeight;
  let labelTop = barRect.top + (finalPercent / 100) * barHeight - (labelHeight / 2);
  
  // Prevent the indicator from going too low (clipping with taskbar)
  const minTopPosition = 80; // Minimum distance from bottom
  const maxTopPosition = barRect.top + barHeight - labelHeight - 20; // Maximum position with some padding
  
  labelTop = Math.max(minTopPosition, Math.min(labelTop, maxTopPosition));
  navbarScrollPercent.style.top = labelTop + 'px';
  navbarScrollPercent.style.right = '16px';

  // Add/remove scrolling class for visibility - sync with sticky navbar
  const scrollSidebar = document.getElementById('scrollSidebar');
  const scrollBarLabel = document.querySelector('.scroll-bar-label');
  
  // Mobile: sync with sticky navbar (appears when scrollY > 0)
  if (window.innerWidth <= 768) {
    if (window.scrollY > 0) {
      scrollSidebar.classList.add('scrolling');
      scrollBarLabel.classList.add('scrolling');
    } else {
      scrollSidebar.classList.remove('scrolling');
      scrollBarLabel.classList.remove('scrolling');
    }
  } else {
    // Desktop: original behavior (appears when scrollTop > 50)
    if (scrollTop > 50) {
      scrollSidebar.classList.add('scrolling');
      scrollBarLabel.classList.add('scrolling');
    } else {
      scrollSidebar.classList.remove('scrolling');
      scrollBarLabel.classList.remove('scrolling');
    }
  }
  
  // Update navigation indicator
  updateNavIndicator();
});

// Removed: scroll listener for navigation indicator

// Initialize footer floating shapes remains

// Footer Circles Animation Function
function initFooterCircles() {
    const footer = document.querySelector('.footer');
    if (!footer) {
        console.log('Footer not found!');
        return;
    }

    // Apply a single mobile-only class to the footer when viewport is mobile-sized.
    // This class is used only to scope animation styles for mobile without
    // touching desktop rules. It will not move or resize circles.
    function applyMobileFooterClass() {
        try {
            if (window.matchMedia && window.matchMedia('(max-width: 1024px)').matches) {
                footer.classList.add('mobile-footer-circles');
                console.log('mobile-footer-circles applied');
            } else {
                footer.classList.remove('mobile-footer-circles');
                console.log('mobile-footer-circles removed');
            }
        } catch (err) {
            console.warn('Error applying mobile footer class', err);
        }
    }
    applyMobileFooterClass();
    window.addEventListener('resize', applyMobileFooterClass);
    window.addEventListener('orientationchange', applyMobileFooterClass);
    
    const circles = footer.querySelectorAll('.footer-circle');
    console.log('Found circles:', circles.length, circles);
    
    if (circles.length === 0) {
        console.log('No circles found in footer!');
        return;
    }
    
    let isSpread = false;
    
    // Add click functionality to spread circles
    circles.forEach(circle => {
        // Add both click and mousedown events for better responsiveness
        circle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent footer click event from firing
            console.log('Circle clicked!', this, 'Current state:', isSpread);
            handleCircleClick();
        });
        
        // Also add mousedown for immediate feedback
        circle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            this.style.transform = 'scale(0.95)';
        });
        
        // Add mouseup to reset transform
        circle.addEventListener('mouseup', function(e) {
            e.stopPropagation();
            this.style.transform = '';
        });
        
        // Add individual click-to-move functionality when spread
        circle.addEventListener('click', function(e) {
            if (isSpread && this.classList.contains('spread')) {
                e.stopPropagation();
                // Toggle movement for this circle - start if not moving, stop if already moving
                if (this.classList.contains('moving')) {
                    stopCircleMovement(this);
                    console.log('Stopped movement for circle');
                } else {
                    startIndividualMovement(this);
                }
            }
        });
    });
    
    // Function to handle circle click logic
    function handleCircleClick() {
        if (!isSpread) {
            // Spread out the circles to random positions
            circles.forEach((circle, index) => {
                circle.classList.add('spread');
                
                // Generate random position across the entire footer area with padding
                const footerRect = footer.getBoundingClientRect();
                const circleRect = circle.getBoundingClientRect();
                
                // Add padding from edges (10% of circle size)
                const padding = circleRect.width * 0.1;
                const maxLeft = footerRect.width - circleRect.width - padding;
                const maxTop = footerRect.height - circleRect.height - padding;
                
                // Ensure minimum position values across entire footer
                const minLeft = padding;
                const minTop = padding;
                
                // Create varied distribution across entire footer area
                const randomLeft = minLeft + (Math.random() * (maxLeft - minLeft));
                const randomTop = minTop + (Math.random() * (maxTop - minTop));
                
                // Apply random position
                circle.style.left = randomLeft + 'px';
                circle.style.top = randomTop + 'px';
                
                console.log('Added spread class to:', circle, 'at position:', randomLeft, randomTop);
            });
            isSpread = true;
            
            // Start automatic return to center after 15 seconds
            setTimeout(() => {
                if (isSpread) {
                    returnCirclesToCenter();
                }
            }, 15000);
        } else {
            // Bring circles back to center
            circles.forEach(circle => {
                circle.classList.remove('spread');
                
                // Reset to center position using the same calc method as CSS
                const circleWidth = circle.offsetWidth;
                const circleHeight = circle.offsetHeight;
                circle.style.left = `calc(50% - ${circleWidth / 2}px)`;
                circle.style.top = `calc(50% - ${circleHeight / 2}px)`;
                
                console.log('Removed spread class from:', circle);
            });
            isSpread = false;
            
            // Stop all movement when returning to center
            stopAllMovement();
        }
    }
    
    // Function to automatically return circles to center with slow animation
    function returnCirclesToCenter() {
        if (!isSpread) return; // Don't return if already centered
        
        circles.forEach(circle => {
            circle.classList.remove('spread');
            
            // Apply very slow transition back to center
            circle.style.transition = 'left 15s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            // Reset to center position using the same calc method as CSS
            const circleWidth = circle.offsetWidth;
            const circleHeight = circle.offsetHeight;
            circle.style.left = `calc(50% - ${circleWidth / 2}px)`;
            circle.style.top = `calc(50% - ${circleHeight / 2}px)`;
            
            console.log('Returning circle to center with slow animation');
        });
        
        isSpread = false;
        
        // Stop all movement when returning to center
        stopAllMovement();
        
        // Remove transition after animation completes
        setTimeout(() => {
            circles.forEach(circle => {
                circle.style.transition = '';
            });
        }, 15000);
    }
    
    // Variables for individual movement tracking
    
    // Function to start individual movement for a specific circle
    function startIndividualMovement(circle) {
        // Only start movement if circle is spread and not already moving
        if (circle.classList.contains('spread') && !circle.classList.contains('moving')) {
            circle.classList.add('moving');
            // Start smooth sliding from current position to opposite side
            const index = Array.from(circles).indexOf(circle);
            startSmoothSliding(circle, index);
            console.log('Started individual movement for circle:', index);
        }
    }
    
    // Function to stop movement for a specific circle
    function stopCircleMovement(circle) {
        circle.classList.remove('moving');
    }
    
    // Function to stop all movement
    function stopAllMovement() {
        circles.forEach(circle => {
            circle.classList.remove('moving');
        });
    }
    
    // Function to start smooth movement toward the front (viewer's direction)
    function startSmoothSliding(circle, index) {
        const footerRect = footer.getBoundingClientRect();
        const circleRect = circle.getBoundingClientRect();
        
        // Get current position - use getBoundingClientRect for more accurate positioning
        const circleBounds = circle.getBoundingClientRect();
        const footerBounds = footer.getBoundingClientRect();
        
        // Calculate relative position within footer
        const currentLeft = circleBounds.left - footerBounds.left;
        const currentTop = circleBounds.top - footerBounds.top;
        
        // Calculate target position toward the front (center of footer)
        const targetLeft = (footerRect.width - circleRect.width) / 2;
        const targetTop = (footerRect.height - circleRect.height) / 2;
        
        // Apply smooth movement toward the front with CSS transition (very slow movement)
        // Use specific properties to avoid conflicts with parallax transforms
        circle.style.transition = 'left 5s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        circle.style.left = targetLeft + 'px';
        circle.style.top = targetTop + 'px';
        
        console.log(`Circle ${index} moving toward front from (${currentLeft}, ${currentTop}) to (${targetLeft}, ${targetTop})`);
        
        // After reaching the front, the circle stays there permanently
        setTimeout(() => {
            if (circle.classList.contains('moving')) {
                console.log(`Circle ${index} has reached the front and will stay there`);
                // Circle remains at the front position - no further movement
            }
        }, 5000); // Wait for 5s movement to complete
    }
    

    
    // Add parallax effect on scroll
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const footerRect = footer.getBoundingClientRect();
        
        // Only apply effect when footer is in view
        if (footerRect.top < window.innerHeight && footerRect.bottom > 0) {
            circles.forEach((circle, index) => {
                const speed = parseFloat(circle.getAttribute('data-speed')) || 0.5;
                const yPos = -(scrolled * speed * 0.1);
                const xPos = -(scrolled * speed * 0.05);
                
                // Apply parallax with current animation transform
                const currentTransform = circle.style.transform || '';
                const baseTransform = currentTransform.replace(/translate\([^)]+\)/, '');
                circle.style.transform = `${baseTransform} translate(${xPos}px, ${yPos}px)`;
            });
        }
    });
    
    // Add mouse interaction for circles
    footer.addEventListener('mousemove', function(e) {
        const rect = footer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        circles.forEach((circle, index) => {
            const speed = parseFloat(circle.getAttribute('data-speed')) || 0.5;
            const moveX = (x - rect.width / 2) * speed * 0.02;
            const moveY = (y - rect.height / 2) * speed * 0.02;
            
            // Combine with existing animation transform
            const currentTransform = circle.style.transform || '';
            const baseTransform = currentTransform.replace(/translate\([^)]+\)/, '');
            circle.style.transform = `${baseTransform} translate(${moveX}px, ${moveY}px)`;
        });
    });
    
    // Add random subtle movement
    setInterval(() => {
        circles.forEach((circle, index) => {
            const randomX = (Math.random() - 0.5) * 8;
            const randomY = (Math.random() - 0.5) * 8;
            
            // Add subtle random movement to existing animation
            const currentTransform = circle.style.transform || '';
            const baseTransform = currentTransform.replace(/translate\([^)]+\)/, '');
            circle.style.transform = `${baseTransform} translate(${randomX}px, ${randomY}px)`;
        });
    }, 6000);
}



// Download icon click handler
document.addEventListener('DOMContentLoaded', function() {
  const downloadIcon = document.querySelector('.contact-section .contact-item:nth-child(4) .contact-icon');
  
  if (downloadIcon) {
    downloadIcon.addEventListener('click', function() {
      const iconElement = this.querySelector('i');
      if (iconElement) {
        this.classList.add('clicked');
        
        // Remove the clicked class after animation completes
        setTimeout(() => {
          this.classList.remove('clicked');
        }, 800);
      }
    });
  }
});

// Statistics counting animation
function animateCount(element, target, duration = 2000, originalTargetText) {
    const startTime = performance.now();
    const hasPlus = originalTargetText.includes('+');
    const targetStr = originalTargetText.replace('+', '');
    const decimalIndex = targetStr.indexOf('.');
    const decimalPlaces = decimalIndex >= 0 ? (targetStr.length - decimalIndex - 1) : 0;

    function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth easing without overshoot; clamp to target
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        let currentValue = target * easeOutCubic;
        currentValue = Math.min(currentValue, target);

        if (progress < 1) {
            if (decimalPlaces > 0) {
                element.textContent = Number(currentValue).toFixed(decimalPlaces) + (hasPlus ? '+' : '');
            } else {
                element.textContent = Math.floor(currentValue) + (hasPlus ? '+' : '');
            }
            requestAnimationFrame(updateCount);
        } else {
            element.textContent = originalTargetText;
        }
    }

    requestAnimationFrame(updateCount);
}

// Intersection Observer for statistics animation
function initStatsAnimation() {
    const statsSection = document.querySelector('.stats-grid');
    if (!statsSection) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-card h3');
                
                statNumbers.forEach((numberElement, index) => {
                    const targetValue = numberElement.textContent;
                    let numericValue;
                    
                    // Parse the target value
                    if (targetValue.includes('+')) {
                        numericValue = parseFloat(targetValue.replace('+', ''));
                    } else {
                        numericValue = parseInt(targetValue);
                    }
                    
                    // Store the original target value for the animation
                    const originalTargetText = targetValue;
                    
                    // Start with 0 for the animation
                    if (targetValue.includes('+')) {
                        numberElement.textContent = '0+';
                    } else {
                        numberElement.textContent = '0';
                    }
                    
                    // Animate after a small delay for staggered effect
                    setTimeout(() => {
                        animateCount(numberElement, numericValue, 3000, originalTargetText);
                    }, index * 100);
                });
                
                // Unobserve after animation to prevent re-triggering
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(statsSection);
}

// Initialize statistics animation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initStatsAnimation();
    initProgressBars();
    initCircularProgress();
});

// Technical Skills progress bar animation
function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill[data-percentage]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressFill = entry.target;
                const percentage = progressFill.getAttribute('data-percentage');
                
                // Animate the progress bar from 0 to target percentage
                animateProgressBar(progressFill, percentage);
                
                // Unobserve after animation to prevent re-triggering
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => observer.observe(bar));
}

function animateProgressBar(progressFill, targetPercentage) {
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    
    function updateProgress(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentPercentage = targetPercentage * easeOutCubic;
        
        if (progress < 1) {
            // Update the progress bar width
            progressFill.style.width = currentPercentage + '%';
            requestAnimationFrame(updateProgress);
        } else {
            // Set final value
            progressFill.style.width = targetPercentage + '%';
            
            // Add animate class to trigger CSS transitions
            progressFill.classList.add('animate');
            
            // Show callout immediately when progress bar stops with bouncy effect
            const callout = progressFill.nextElementSibling;
            if (callout && callout.classList.contains('progress-callout')) {
                // Add bouncy transition for callout appearance
                callout.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                callout.style.opacity = '1';
                
                // Handle different callout positioning based on skill level with bouncy effect
                if (callout.classList.contains('skill-intermediate')) {
                    callout.style.transform = 'translateX(-50%) translateY(0) scale(1.1)';
                    // Add bounce back effect
                    setTimeout(() => {
                        callout.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                        callout.style.transform = 'translateX(-50%) translateY(0) scale(1)';
                    }, 200);
                } else if (callout.classList.contains('skill-basic')) {
                    callout.style.transform = 'translateX(-50%) translateY(0) scale(1.1)';
                    // Add bounce back effect
                    setTimeout(() => {
                        callout.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                        callout.style.transform = 'translateX(-50%) translateY(0) scale(1)';
                    }, 200);
                } else {
                    callout.style.transform = 'translateY(0) scale(1.1)';
                    // Add bounce back effect
                    setTimeout(() => {
                        callout.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                        callout.style.transform = 'translateY(0) scale(1)';
                    }, 200);
                }
            }
        }
    }
    
    requestAnimationFrame(updateProgress);
}

// Circular progress bar animation
function initCircularProgress() {
    const circularProgressBars = document.querySelectorAll('.circular-progress');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const percentage = progressBar.getAttribute('data-percentage');
                const progressFill = progressBar.querySelector('.progress-fill');
                
                // Animate the circular progress from 0 to target percentage
                animateCircularProgress(progressFill, percentage);
                
                // Unobserve after animation to prevent re-triggering
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    circularProgressBars.forEach(bar => observer.observe(bar));
}

function animateCircularProgress(progressFill, targetPercentage) {
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    const circumference = 283; // 2 * π * radius (45)
    
    function updateProgress(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentPercentage = targetPercentage * easeOutCubic;
        
        if (progress < 1) {
            // Update the SVG stroke-dashoffset to show progress
            const offset = circumference - (currentPercentage / 100) * circumference;
            progressFill.style.strokeDashoffset = offset;
            requestAnimationFrame(updateProgress);
        } else {
            // Set final value
            const offset = circumference - (targetPercentage / 100) * circumference;
            progressFill.style.strokeDashoffset = offset;
        }
    }
    
    requestAnimationFrame(updateProgress);
}

// Certificate Navigation Functions - Infinite Loop Implementation
let currentScrollPosition = 0;
let isManualControl = false;
let autoScrollInterval;
let isTransitioning = false;
let originalCardsCount = 10; // Number of original cards (before duplication)

function scrollCertifications(direction) {
    const track = document.querySelector('.certifications-track');
    const carousel = document.querySelector('.certifications-carousel');
    
    if (!track || !carousel || isTransitioning) return;
    
    // Disable the CSS animation for manual control
    track.style.animation = 'none';
    isManualControl = true;
    isTransitioning = true;
    
    const cardWidth = track.querySelector('.certification-card').offsetWidth + 16; // card width + gap
    const visibleCards = Math.floor(carousel.offsetWidth / cardWidth);
    const scrollAmount = cardWidth * Math.max(1, Math.floor(visibleCards / 2));
    
    if (direction === 'prev') {
        currentScrollPosition -= scrollAmount;
    } else if (direction === 'next') {
        currentScrollPosition += scrollAmount;
    }
    
    // Apply the new position with fast, responsive transition
    track.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    track.style.transform = `translateX(-${currentScrollPosition}px)`;
    
    // Handle infinite loop logic - simplified for instant response
    setTimeout(() => {
        const totalCardsWidth = originalCardsCount * cardWidth;
        
        if (direction === 'next' && currentScrollPosition >= totalCardsWidth) {
            // Reset to beginning seamlessly
            track.style.transition = 'none';
            currentScrollPosition = currentScrollPosition - totalCardsWidth;
            track.style.transform = `translateX(-${currentScrollPosition}px)`;
        } else if (direction === 'prev' && currentScrollPosition < 0) {
            // Simplified left navigation - instant positioning
            track.style.transition = 'none';
            currentScrollPosition = totalCardsWidth + currentScrollPosition;
            track.style.transform = `translateX(-${currentScrollPosition}px)`;
        }
        
        isTransitioning = false;
    }, 300); // Reduced timeout for instant response
    
    // Clear any existing auto-scroll
    clearInterval(autoScrollInterval);
    clearTimeout(window.certTimeout);
    
    // Resume automatic scrolling after 3 seconds
    window.certTimeout = setTimeout(() => {
        if (isManualControl) {
            startAutoScroll();
            isManualControl = false;
        }
    }, 3000);
}

function startAutoScroll() {
    const track = document.querySelector('.certifications-track');
    if (!track) return;
    
    // Clear any existing interval
    clearInterval(autoScrollInterval);
    
    // Reset position and restore the original CSS animation
    track.style.transform = 'translateX(0)';
    track.style.transition = 'none';
    track.style.animation = 'slideLeft 25s linear infinite';
    track.style.animationPlayState = 'running';
    currentScrollPosition = 0;
}

// Initialize auto-scroll when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        startAutoScroll();
    }, 1000); // Start after 1 second
});

// Portfolio Tab Functionality
function initPortfolioTabs() {
    const tabs = document.querySelectorAll('.portfolio-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const portfolioContent = document.querySelector('.portfolio-content');
    
    // Hide all content except the selected one
    function showTabContent(selectedTab) {
        portfolioContent.classList.remove('show-all');
        tabContents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(selectedTab + '-content');
        if (targetContent) {
            targetContent.style.display = 'block';
            targetContent.classList.add('active');
        }
    }
    
    // Add click event listeners to tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Get the tab data attribute
            const tabType = this.getAttribute('data-tab');
            
            // Show appropriate content
            showTabContent(tabType);
        });
    });
    
    // Initialize with "Certification" tab active
    showTabContent('certifications');
}

// Initialize portfolio tabs when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initPortfolioTabs();
    initProfileImageFlip();
});

// Accordion functionality
document.addEventListener('DOMContentLoaded', function() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        
        header.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Close all accordion items
            accordionItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
    
});

// Profile Image Switch with Flip Animation
function initProfileImageFlip() {
    const profileImage = document.getElementById('profileImage');
    const aboutSection = document.getElementById('about');
    
    if (!profileImage || !aboutSection) {
        console.log('Profile image elements not found');
        return;
    }
    
    console.log('Profile image switch initialized');
    
    const formalImageSrc = 'assets/img/profile images/robin_hossain_formal_image.jpg';
    const informalImageSrc = 'assets/img/profile images/robin_hossain_informal_image.jpg';
    
    // Function to start the image switch timer
    function startImageTimer() {
        console.log('Starting image switch timer');
        
        // Clear any existing timer
        if (profileFlipTimer) {
            clearTimeout(profileFlipTimer);
        }
        
        // Reset to formal image
        profileImage.src = formalImageSrc;
        profileImage.alt = 'Robin Hossain - Formal';
        console.log('Reset to formal image');
        
        // After 15 seconds, switch to informal image with flip effect
        profileFlipTimer = setTimeout(() => {
            // Add flip animation class
            profileImage.classList.add('flipping');
            console.log('Starting flip to informal image');
            
            // Switch image at the peak of the flip (halfway through animation)
            setTimeout(() => {
                profileImage.src = informalImageSrc;
                profileImage.alt = 'Robin Hossain - Informal';
                console.log('Switched to informal image');
            }, 300); // Half of 0.6s animation
            
            // Remove animation class after animation completes
            setTimeout(() => {
                profileImage.classList.remove('flipping');
            }, 600); // Full animation duration
            
            // After another 15 seconds, switch back to formal image with flip effect
            profileFlipTimer = setTimeout(() => {
                // Add flip animation class
                profileImage.classList.add('flipping');
                console.log('Starting flip to formal image');
                
                // Switch image at the peak of the flip
                setTimeout(() => {
                    profileImage.src = formalImageSrc;
                    profileImage.alt = 'Robin Hossain - Formal';
                    console.log('Switched back to formal image');
                }, 300); // Half of 0.6s animation
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    profileImage.classList.remove('flipping');
                    
                    // Restart the cycle if still in about section
                    if (isInAboutSection) {
                        startImageTimer();
                    }
                }, 600); // Full animation duration
            }, 15000); // 15 seconds for informal image
        }, 15000); // 15 seconds for formal image
    }
    
    // Function to stop the image timer
    function stopImageTimer() {
        console.log('Stopping image switch timer');
        if (profileFlipTimer) {
            clearTimeout(profileFlipTimer);
            profileFlipTimer = null;
        }
        // Reset to formal image when leaving section
        profileImage.src = formalImageSrc;
        profileImage.alt = 'Robin Hossain - Formal';
        profileImage.classList.remove('flipping');
        profileImage.style.transform = 'rotateY(0deg)';
    }
    
    // Intersection Observer to detect when user enters/leaves the about section
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // User entered the about section
                console.log('User entered about section');
                isInAboutSection = true;
                aboutSectionStartTime = Date.now();
                startImageTimer();
            } else {
                // User left the about section
                console.log('User left about section');
                isInAboutSection = false;
                aboutSectionStartTime = null;
                stopImageTimer();
            }
        });
    }, {
        threshold: 0.3 // Trigger when 30% of the section is visible
    });
    
    // Start observing the about section
    observer.observe(aboutSection);
    console.log('Intersection observer started for about section');
    
    // Add manual test function for debugging
    window.testImageSwitch = function() {
        console.log('Manual image switch test triggered');
        if (profileImage.src.includes('formal')) {
            profileImage.src = informalImageSrc;
            profileImage.alt = 'Robin Hossain - Informal';
            console.log('Switched to informal image');
        } else {
            profileImage.src = formalImageSrc;
            profileImage.alt = 'Robin Hossain - Formal';
            console.log('Switched to formal image');
        }
    };
}

// Mobile Toast Message
// NOTE: Mobile-only behavior. Show exactly 2 seconds after full page load,
// and keep visible for 5 seconds (the 5s countdown starts only after load).
window.addEventListener('load', function() {
    // Only show on mobile (max-width: 1024px)
    if (window.innerWidth > 1024) return;

    // Create toast message (re-using existing id/class patterns)
    const toast = document.createElement('div');
    toast.id = 'mobile-toast';
    toast.textContent = 'For the best experience, please view this portfolio on a desktop.';

    // Add CSS styles (scoped to mobile-toast element)
    const style = document.createElement('style');
    style.textContent = `
        #mobile-toast {
            position: fixed !important;
            bottom: 15px !important;
            left: 50% !important;
            transform: translateX(-50%) translateY(100%) !important;
            background: rgba(17, 24, 39, 0.95) !important;
            color: #ffffff !important;
            padding: 6px 160px !important;
            border-radius: 8px !important;
            font-size: 10.5px !important;
            font-weight: 500 !important;
            z-index: 10000 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(139, 92, 246, 0.3) !important;
            max-width: 90% !important;
            text-align: center !important;
            white-space: nowrap !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            opacity: 0 !important;
            transition: all 0.3s ease-out !important;
        }

        #mobile-toast.show {
            transform: translateX(-50%) translateY(0) !important;
            opacity: 1 !important;
        }

        #mobile-toast.hide {
            transform: translateX(-50%) translateY(100%) !important;
            opacity: 0 !important;
        }
    `;
    document.head.appendChild(style);

    // Wait exactly 3 seconds after the page `load` event, then show the toast.
    setTimeout(function() {
        document.body.appendChild(toast);

        // Trigger show animation (tiny delay to allow insertion)
        setTimeout(function() {
            toast.classList.add('show');
        }, 10);

        // Auto-hide after 5 seconds (count begins after page load + 2s show)
        setTimeout(function() {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }, 2000);

    // Hide on click
    toast.addEventListener('click', function() {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
});