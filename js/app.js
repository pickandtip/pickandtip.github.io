// ==========================================
// PICK & TIP - SPA ROUTER & GLOBAL STATE
// ==========================================

// Global state
window.currentLang = 'fr';
window.translations = {};
let currentTopic = null;

// ==========================================
// LANGUAGE MANAGEMENT
// ==========================================
function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const savedLang = localStorage.getItem('pickandtip-lang');

    if (savedLang) {
        return savedLang;
    }

    if (browserLang.startsWith('en')) {
        return 'en';
    }

    return 'fr';
}

function setLanguage(lang) {
    window.currentLang = lang;
    localStorage.setItem('pickandtip-lang', lang);
    document.documentElement.lang = lang;

    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Apply translations
    applyTranslations();
}

function applyTranslations() {
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const translation = getNestedTranslation(window.translations[window.currentLang], key);
        if (translation) {
            el.textContent = translation;
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const translation = getNestedTranslation(window.translations[window.currentLang], key);
        if (translation) {
            el.placeholder = translation;
        }
    });

    // Update select options
    const regionFilterEl = document.getElementById('regionFilter');
    if (regionFilterEl) {
        const options = regionFilterEl.querySelectorAll('option');
        options.forEach(option => {
            const key = option.dataset.i18n;
            if (key) {
                const translation = getNestedTranslation(window.translations[window.currentLang], key);
                if (translation) {
                    option.textContent = translation;
                }
            }
        });
    }
}

function getNestedTranslation(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

window.replaceTokens = function(text, lang) {
    if (!text || typeof text !== 'string') return text;
    const tokens = window.translations[lang].tokens || {};
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => tokens[key] || match);
};

window.applyTranslations = applyTranslations;

// ==========================================
// ROUTER - SPA NAVIGATION
// ==========================================
const routes = {
    '': 'landing',
    'property-taxes': 'property-taxes',
    'vat': 'vat',
    'airbnb': 'airbnb'
};

async function loadView(viewName) {
    const appContainer = document.getElementById('app-container');
    const breadcrumb = document.getElementById('breadcrumb');

    try {
        // Load the HTML template
        const response = await fetch(`views/${viewName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load view: ${viewName}`);
        }
        const html = await response.text();
        appContainer.innerHTML = html;

        // Update breadcrumb
        if (viewName === 'landing') {
            breadcrumb.style.display = 'none';
        } else {
            breadcrumb.style.display = 'block';
            const topicName = document.querySelector('.topic-view h1')?.textContent || viewName;
            document.getElementById('current-topic').textContent = topicName;
        }

        // Load topic-specific JavaScript if exists
        if (viewName !== 'landing') {
            await loadTopicScript(viewName);
        }

        // Apply translations to the new view
        applyTranslations();

    } catch (error) {
        console.error('Error loading view:', error);
        appContainer.innerHTML = '<div class="error-message">Failed to load content. Please try again.</div>';
    }
}

async function loadTopicScript(topicName) {
    return new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector(`script[src="js/topics/${topicName}.js"]`);
        if (existingScript) {
            // Script already loaded, just call init function
            if (window[`init${capitalize(camelize(topicName))}`]) {
                window[`init${capitalize(camelize(topicName))}`]();
            }
            resolve();
            return;
        }

        // Load new script
        const script = document.createElement('script');
        script.src = `js/topics/${topicName}.js`;
        script.onload = () => {
            // Call the init function for this topic
            if (window[`init${capitalize(camelize(topicName))}`]) {
                window[`init${capitalize(camelize(topicName))}`]();
            }
            resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${topicName}.js`));
        document.body.appendChild(script);
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelize(str) {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

function navigateTo(route) {
    window.location.hash = route;
}

function handleRoute() {
    const hash = window.location.hash.slice(1); // Remove the '#'
    const route = routes[hash] || 'landing';
    currentTopic = route;
    loadView(route);
}

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
    try {
        // Load translations
        const [frTranslations, enTranslations] = await Promise.all([
            fetch('data/i18n/fr.json').then(res => res.json()),
            fetch('data/i18n/en.json').then(res => res.json())
        ]);

        window.translations = {
            fr: frTranslations,
            en: enTranslations
        };

        // Detect and set language
        const detectedLang = detectLanguage();
        setLanguage(detectedLang);

        // Setup language switcher
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setLanguage(btn.dataset.lang);
            });
        });

        // Setup router
        window.addEventListener('hashchange', handleRoute);

        // Setup home button
        document.getElementById('home-btn')?.addEventListener('click', () => {
            navigateTo('');
        });

        // Load initial route
        handleRoute();

    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Failed to load application. Please refresh the page.');
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export navigation function
window.navigateTo = navigateTo;
