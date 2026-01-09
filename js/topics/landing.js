// ==========================================
// LANDING PAGE - DYNAMIC TOPIC STATS
// ==========================================

(async function() {
    'use strict';

    let totalCountries = 0;

    /**
     * Randomize thinking bubble animation order
     */
    function randomizeThinkingBubbles() {
        const bubbles = document.querySelectorAll('.topic-thinking-bubble');

        // Keep regular intervals (0s, 7s, 14s, 21s, etc.) but shuffle the order
        const delays = Array.from({ length: bubbles.length }, (_, i) => i * 7);

        // Shuffle delays array (Fisher-Yates algorithm)
        for (let i = delays.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [delays[i], delays[j]] = [delays[j], delays[i]];
        }

        // Apply shuffled delays to each bubble
        bubbles.forEach((bubble, index) => {
            bubble.style.setProperty('--animation-delay', `${delays[index]}s`);
        });
    }

    /**
     * Initialize landing page with dynamic statistics
     */
    async function initLanding() {
        try {
            // Randomize thinking bubble animations
            randomizeThinkingBubbles();

            // Initialize concept banner
            initConceptBanner();

            // Initialize contact form if module is available
            initContactForm();

            // Fetch total number of countries from reference database
            const countriesResponse = await fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.countries));
            const countriesData = await countriesResponse.json();
            const countries = countriesData.results || countriesData;
            totalCountries = countries.length;

            // Fetch data for each topic
            const [propertyTaxesData, vatData, vacationRentalBusinessData] = await Promise.all([
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.propertyTaxes)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.vat)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.vacationRentalBusiness)).then(res => res.json())
            ]);

            // Update each topic card with dynamic stats
            updatePropertyTaxesStats(propertyTaxesData);
            updateVatStats(vatData);
            updateVacationRentalBusinessStats(vacationRentalBusinessData);

        } catch (error) {
            console.error('Error loading landing page statistics:', error);
        }
    }

    /**
     * Initialize concept banner (only for landing page)
     */
    function initConceptBanner() {
        const container = document.getElementById('concept-banner-container');
        if (!container) return;

        // Insert the concept banner HTML
        container.innerHTML = `
            <div class="concept-banner">
                <div class="concept-banner-overlay">
                    <div class="concept-text">
                        <h2 class="concept-title">{{ landing.conceptBanner.title }}</h2>
                        <p class="concept-description">{{ landing.conceptBanner.description }}</p>
                    </div>
                </div>
                <div class="image-scroll-container">
                    <div class="image-scroll-track">
                        <!-- First set of images -->
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80');" aria-label="Mountain landscape"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80');" aria-label="Pool lifestyle"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80');" aria-label="Luxury beach villa"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80');" aria-label="Beautiful city skyline"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80');" aria-label="Adventure and freedom"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80');" aria-label="Coastal paradise"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80');" aria-label="Beautiful architecture"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80');" aria-label="Tropical getaway"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80');" aria-label="Gold bars wealth"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80');" aria-label="Luxury dining"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80');" aria-label="Urban lifestyle"></div>
                        <!-- Duplicate set for seamless loop -->
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80');" aria-label="Mountain landscape"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80');" aria-label="Pool lifestyle"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80');" aria-label="Luxury beach villa"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80');" aria-label="Beautiful city skyline"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80');" aria-label="Adventure and freedom"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80');" aria-label="Coastal paradise"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80');" aria-label="Beautiful architecture"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80');" aria-label="Tropical getaway"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80');" aria-label="Gold bars wealth"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80');" aria-label="Luxury dining"></div>
                        <div class="scroll-image" style="background-image: url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80');" aria-label="Urban lifestyle"></div>
                    </div>
                </div>
            </div>
        `;

        // Apply translations to the newly inserted content
        if (window.applyTokensToDOM) {
            window.applyTokensToDOM(container);
        }
    }

    /**
     * Initialize contact form banner
     */
    function initContactForm() {
        const container = document.getElementById('contact-form-container');
        if (!container || !window.ContactFormModule) return;

        // Insert the contact form HTML
        container.innerHTML = window.ContactFormModule.getHTML();

        // Apply translations to the newly inserted content
        if (window.applyTokensToDOM) {
            window.applyTokensToDOM(container);
        }

        // Initialize the contact form module
        window.ContactFormModule.init();
    }

    /**
     * Update Property Taxes card statistics
     */
    function updatePropertyTaxesStats(data) {
        const countries = data.countries || data;
        const count = countries.length;

        const statsContainer = document.querySelector('.topic-card[onclick*="property-taxes"] .topic-stats');
        if (statsContainer) {
            const currentLang = window.currentLang || 'fr';
            const badge = statsContainer.querySelector('.stat-badge:first-child');
            if (badge) {
                const text = currentLang === 'fr'
                    ? `✓ ${count} pays sur ${totalCountries}`
                    : `✓ ${count} countries out of ${totalCountries}`;
                badge.textContent = text;
            }
        }
    }

    /**
     * Update VAT card statistics
     */
    function updateVatStats(data) {
        const countries = data.countries || data;
        const count = countries.length;

        const statsContainer = document.querySelector('.topic-card[onclick*="vat"] .topic-stats');
        if (statsContainer) {
            const currentLang = window.currentLang || 'fr';
            const badge = statsContainer.querySelector('.stat-badge:first-child');
            if (badge) {
                const text = currentLang === 'fr'
                    ? `✓ ${count} pays sur ${totalCountries}`
                    : `✓ ${count} countries out of ${totalCountries}`;
                badge.textContent = text;
            }
        }
    }

    /**
     * Update Vacation Rental Business card statistics
     */
    function updateVacationRentalBusinessStats(data) {
        const countries = data.countries || data;
        const count = countries.length;

        const statsContainer = document.querySelector('.topic-card[onclick*="vacation-rental-business"] .topic-stats');
        if (statsContainer) {
            const currentLang = window.currentLang || 'fr';
            const badge = statsContainer.querySelector('.stat-badge:first-child');
            if (badge) {
                const text = currentLang === 'fr'
                    ? `✓ ${count} pays sur ${totalCountries}`
                    : `✓ ${count} countries out of ${totalCountries}`;
                badge.textContent = text;
            }
        }
    }

    /**
     * Update stats when language changes
     */
    window.addEventListener('languageChanged', () => {
        // Re-initialize to update text with new language
        initLanding();
    });

    // Export init function
    window.initLanding = initLanding;

})();
