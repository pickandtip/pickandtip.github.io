// Configuration de l'application Pick & Tip
// Ce fichier contient les URLs de l'API et autres paramètres

const CONFIG = {
    // URL de l'API backend
    // En développement local: http://localhost:3001
    // En production: https://pickandtip-api.vercel.app (à remplacer après déploiement)
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : 'https://pickandtip-api.vercel.app',

    // Endpoints
    ENDPOINTS: {
        countries: '/api/countries',
        vat: '/api/topics/vat',
        propertyTaxes: '/api/topics/property-taxes',
        vacationRentalBusiness: '/api/topics/vacation-rental-business',
        vacationRentalHotspots: '/api/topics/vacation-rental-hotspots',
        i18n: {
            fr: '/api/i18n/fr',
            en: '/api/i18n/en'
        }
    },

    // Helper pour construire l'URL complète
    getApiUrl(endpoint) {
        return this.API_BASE_URL + endpoint;
    }
};

// Exporter pour usage global
window.CONFIG = CONFIG;
