// ==========================================
// LANDING PAGE - DYNAMIC TOPIC STATS
// ==========================================

(async function() {
    'use strict';

    let totalCountries = 0;

    /**
     * Initialize landing page with dynamic statistics
     */
    async function initLanding() {
        try {
            // Fetch total number of countries from reference database
            const countriesResponse = await fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.countries));
            const countriesData = await countriesResponse.json();
            totalCountries = countriesData.length;

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
