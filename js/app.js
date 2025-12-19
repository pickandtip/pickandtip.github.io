// ==========================================
// PICK & TIP - SPA ROUTER & GLOBAL STATE
// ==========================================

(function() {
    'use strict';

    // Module-scoped state (not polluting global scope)
    let currentLang = 'fr';
    let translations = {};
    let currentTopic = null;

    // Export only what's needed to window
    window.PickAndTip = window.PickAndTip || {};

    // Expose necessary getters/setters
    Object.defineProperty(window, 'currentLang', {
        get: function() { return currentLang; },
        set: function(value) { currentLang = value; }
    });

    Object.defineProperty(window, 'translations', {
        get: function() { return translations; },
        set: function(value) { translations = value; }
    });

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
        currentLang = lang;
        localStorage.setItem('pickandtip-lang', lang);
        document.documentElement.lang = lang;

        // Update language buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Apply translations
        applyTranslations();

        // Update breadcrumb if on a topic page
        const breadcrumb = document.getElementById('breadcrumb');
        const currentTopicEl = document.getElementById('current-topic');
        if (breadcrumb && breadcrumb.style.display !== 'none' && currentTopicEl) {
            const topicName = document.querySelector('.topic-view h1')?.textContent;
            if (topicName) {
                currentTopicEl.textContent = topicName;
            }
        }

        // Trigger language change event for topics to re-render
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    function applyTranslations() {
        // Apply token-based translations to the entire document
        applyTokensToDOM(document.body);
    }

    function getNestedTranslation(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    // Enhanced token replacement function with nested object support
    function replaceTokens(text, lang) {
        if (!text || typeof text !== 'string') return text;
        const translationData = translations[lang];
        return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
            // Support dot notation for nested objects (e.g., "breadcrumb.home")
            const value = getNestedTranslation(translationData, key);
            return value !== undefined ? value : match;
        });
    }

    // Store original templates before any translation
    const templateStore = new WeakMap();

    // Apply translations to all elements in the DOM
    function applyTokensToDOM(element = document.body) {
        // Walk through all text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(node => {
            if (!node.parentElement) return;
            const parent = node.parentElement;

            // Skip script and style
            if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;

            // Get or store the original template
            let template;
            if (templateStore.has(node)) {
                template = templateStore.get(node);
            } else if (node.nodeValue && node.nodeValue.includes('{{')) {
                template = node.nodeValue;
                templateStore.set(node, template);
            }

            // Apply translation if we have a template
            if (template) {
                node.nodeValue = replaceTokens(template, currentLang);
            }
        });

        // Process placeholders
        element.querySelectorAll('[placeholder]').forEach(el => {
            let template;
            const key = 'placeholder-template';

            if (templateStore.has(el) && templateStore.get(el)[key]) {
                template = templateStore.get(el)[key];
            } else if (el.placeholder.includes('{{')) {
                template = el.placeholder;
                const stored = templateStore.get(el) || {};
                stored[key] = template;
                templateStore.set(el, stored);
            }

            if (template) {
                el.placeholder = replaceTokens(template, currentLang);
            }
        });

        // Process titles
        element.querySelectorAll('[title]').forEach(el => {
            let template;
            const key = 'title-template';

            if (templateStore.has(el) && templateStore.get(el)[key]) {
                template = templateStore.get(el)[key];
            } else if (el.title && el.title.includes('{{')) {
                template = el.title;
                const stored = templateStore.get(el) || {};
                stored[key] = template;
                templateStore.set(el, stored);
            }

            if (template) {
                el.title = replaceTokens(template, currentLang);
            }
        });
    }

    // Make functions available globally for use in topic modules
    window.replaceTokens = replaceTokens;
    window.applyTokensToDOM = applyTokensToDOM;

    // ==========================================
    // ROUTER - SPA NAVIGATION
    // ==========================================
    const routes = {
        '': 'landing',
        'property-taxes': 'property-taxes',
        'vat': 'vat',
        'vacation-rental-business': 'vacation-rental-business',
        'vacation-rental-hotspots': 'vacation-rental-hotspots'
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

            // Wait for DOM to be fully rendered before proceeding
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            });

            // Load topic-specific JavaScript if exists
            if (viewName !== 'landing') {
                await loadTopicScript(viewName);
            }

            // Apply translations to the new view
            applyTranslations();

            // Update breadcrumb AFTER translations are applied
            if (viewName === 'landing') {
                breadcrumb.style.display = 'none';
            } else {
                breadcrumb.style.display = 'block';
                const topicName = document.querySelector('.topic-view h1')?.textContent || viewName;
                document.getElementById('current-topic').textContent = topicName;
            }

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

            translations = {
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

    // Export to PickAndTip namespace
    window.PickAndTip.navigateTo = navigateTo;
    window.PickAndTip.applyTranslations = applyTranslations;
    window.PickAndTip.replaceTokens = replaceTokens;

    // Export navigation function to window for backwards compatibility
    window.navigateTo = navigateTo;
    window.applyTranslations = applyTranslations;

})(); // End of PickAndTip module
