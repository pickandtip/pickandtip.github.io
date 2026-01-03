(function() {
    'use strict';

    // Topic-specific state for Vacation Rental Business (encapsulated in module scope)
    let countries = [];
    let rentalData = [];
    let countryData = [];
    let currentSort = { column: 'country', direction: 'asc' };
    let currentRegionFilter = 'all';
    let currentLegalFilter = 'all';
    let currentServicesFilter = 'all';

    // DOM Elements
    let tableBody, searchInput, regionFilter, legalFilter, servicesFilter, resultCount, noResults;

    // Legal framework level mapping
    const legalLevels = {
        'permissive': { value: 0, label: { fr: 'Permissif', en: 'Permissive' }, color: '#4CAF50' },
        'moderate': { value: 1, label: { fr: 'Modéré', en: 'Moderate' }, color: '#2196F3' },
        'restrictive_local': { value: 2, label: { fr: 'Restrictions locales', en: 'Local restrictions' }, color: '#FF9800' },
        'prohibited_exceptions': { value: 3, label: { fr: 'Interdit sauf exceptions', en: 'Banned with exceptions' }, color: '#9E9E9E' },
        'prohibited': { value: 4, label: { fr: 'Interdit', en: 'Banned' }, color: '#F44336' }
    };

    // Management services level mapping
    const servicesLevels = {
        'professional': { value: 2, label: { fr: 'Professionnels', en: 'Professional' }, color: '#4CAF50' },
        'limited': { value: 1, label: { fr: 'Limités', en: 'Limited' }, color: '#FF9800' },
        'none': { value: 0, label: { fr: 'Rares/inexistants', en: 'Rare/non-existent' }, color: '#F44336' }
    };

    // Load data
    async function loadVacationRentalBusinessData() {
        try {
            const [countriesData, rentalBusinessData] = await Promise.all([
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.countries)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.vacationRentalBusiness)).then(res => res.json())
            ]);

            countries = countriesData;
            rentalData = rentalBusinessData.countries || rentalBusinessData;

            // Merge with country data
            countryData = rentalData.map(rental => {
                const country = countries.find(c => c.code === rental.countryCode);
                if (!country) {
                    console.warn(`Country not found for code: ${rental.countryCode}`);
                    return null;
                }
                return {
                    ...rental,
                    countryName: country.name,
                    flag: country.flag,
                    region: country.region
                };
            }).filter(item => item !== null);

            return true;
        } catch (error) {
            console.error('Error loading vacation rental business data:', error);
            alert('Failed to load data. Please refresh the page.');
            return false;
        }
    }

    // Use tooltip module functions
    const createTooltipCell = window.TooltipModule.createTooltipCell;
    const setupSmartTooltip = window.TooltipModule.setupSmartTooltip;

    // Get legal framework badge with info icon and tooltip
    function getLegalBadge(legalFramework, countryNotes) {
        const level = legalLevels[legalFramework.level];
        const label = level.label[window.currentLang] || level.label.fr;
        const details = legalFramework.details[window.currentLang] || legalFramework.details.fr;

        // Combine legal framework details with country-specific notes
        const lang = window.currentLang;
        const notes = countryNotes ? (countryNotes[lang] || countryNotes.fr) : '';

        let tooltipContent = details;
        if (notes && notes.trim() !== '') {
            const legalLabel = lang === 'fr' ? 'Cadre légal:' : 'Legal Framework:';
            const notesLabel = lang === 'fr' ? 'Notes importantes:' : 'Important Notes:';

            tooltipContent = `
                <div style="margin-bottom: 0.75rem;">
                    <strong style="color: var(--brand-gold); display: block; margin-bottom: 0.5rem;">${legalLabel}</strong>
                    ${details}
                </div>
                <div>
                    <strong style="color: var(--brand-gold); display: block; margin-bottom: 0.5rem;">${notesLabel}</strong>
                    ${notes}
                </div>
            `;
        }

        return createTooltipCell({
            mainContent: `<span class="legal-badge" style="background-color: ${level.color}">${label}</span>`,
            tooltipContent: tooltipContent,
            cellClass: 'legal-framework-cell',
            iconClass: 'legal-info-icon',
            tooltipClass: 'legal-tooltip',
            position: 'right'
        });
    }

    // Format taxation with tooltip
    function formatTaxation(country) {
        const lang = window.currentLang;

        const items = country.taxation.items[lang] || country.taxation.items.fr;
        const notes = country.taxation.notes ? (country.taxation.notes[lang] || country.taxation.notes.fr) : '';

        const itemsHtml = items.map(item => `<div style="font-size: 0.85em; line-height: 1.4;">${item}</div>`).join('');

        // Toujours afficher l'icône, mais avec un état visuel différent
        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.vacationRentalBusiness?.tooltips?.noAdditionalInfo || 'N/A');

        return createTooltipCell({
            mainContent: `<div class="taxation-items">${itemsHtml}</div>`,
            tooltipContent: tooltipContent,
            cellClass: 'taxation-cell',
            iconClass: 'taxation-info-icon',
            tooltipClass: 'taxation-tooltip',
            iconFirst: true,
            isEmpty: !hasNotes  // Use module's isEmpty parameter for color coding
        });
    }

    // Get services badge
    function getServicesBadge(services) {
        const level = servicesLevels[services.level];
        const label = level.label[window.currentLang] || level.label.fr;

        let tooltip = '';
        if (services.examples && services.examples.length > 0) {
            tooltip = ` title="${services.examples.join(', ')}"`;
        }

        return `<span class="services-badge" style="background-color: ${level.color}"${tooltip}>${label}</span>`;
    }
    
    // Get platforms display
    function getPlatformsDisplay(platforms) {
        if (!platforms || platforms.length === 0) return '<span style="color: #999;">N/A</span>';

        const badges = platforms.map(platform => {
            const langs = platform.languages.map(lang => {
                const flags = { 'fr': '🇫🇷', 'en': '🇬🇧', 'es': '🇪🇸', 'pt': '🇵🇹', 'it': '🇮🇹', 'de': '🇩🇪', 'nl': '🇳🇱', 'el': '🇬🇷', 'tr': '🇹🇷', 'ar': '🇸🇦', 'ja': '🇯🇵', 'th': '🇹🇭', 'zh': '🇨🇳' };
                return flags[lang] || lang;
            }).join('');

            const scope = platform.scope === 'international' ? '🌍' : '📍';
            return `<div class="platform-item" title="${platform.name}">${scope} ${platform.name} ${langs}</div>`;
        }).join('');

        return `<div class="platforms-list">${badges}</div>`;
    }

    // Render table
    function renderTableBusiness(data) {
        tableBody.innerHTML = '';
    
        if (data.length === 0) {
            noResults.classList.remove('hidden');
            resultCount.textContent = '0';
            return;
        }

        noResults.classList.add('hidden');
        resultCount.textContent = data.length;
    
        data.forEach(country => {
            const row = document.createElement('tr');

            const countryName = country.countryName[window.currentLang] || country.countryName.fr;
            const regionLabel = window.translations?.regions?.[country.region] || country.region;

            row.innerHTML = `
                <td><span class="flag">${country.flag}</span> ${countryName}</td>
                <td>${regionLabel}</td>
                <td class="legal-framework-td">${getLegalBadge(country.legalFramework, country.notes)}</td>
                <td class="small-text taxation-td">${formatTaxation(country)}</td>
                <td class="platforms-cell">${getPlatformsDisplay(country.platforms)}</td>
                <td>${getServicesBadge(country.managementServices)}</td>
            `;

            // Initialize tooltips using the unified module
            window.TooltipModule.initializeTooltips(row);

            tableBody.appendChild(row);
        });
    }
    
    // Filter and sort
    function filterAndSortBusiness() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedRegion = regionFilter.value;
        const selectedLegal = legalFilter.value;
        const selectedServices = servicesFilter.value;
    
        let filtered = countryData.filter(country => {
            // Search filter
            const countryName = (country.countryName.fr || '').toLowerCase() + ' ' + (country.countryName.en || '').toLowerCase();
            const matchesSearch = countryName.includes(searchTerm);
    
            // Region filter
            const matchesRegion = selectedRegion === 'all' || country.region === selectedRegion;
    
            // Legal filter
            const matchesLegal = selectedLegal === 'all' || country.legalFramework.level === selectedLegal;
    
            // Services filter
            const matchesServices = selectedServices === 'all' || country.managementServices.level === selectedServices;
    
            return matchesSearch && matchesRegion && matchesLegal && matchesServices;
        });
    
        // Sort
        filtered.sort((a, b) => {
            let aVal, bVal;
    
            switch (currentSort.column) {
                case 'country':
                    aVal = a.countryName[window.currentLang] || a.countryName.fr;
                    bVal = b.countryName[window.currentLang] || b.countryName.fr;
                    break;
                case 'region':
                    aVal = a.region;
                    bVal = b.region;
                    break;
                case 'legalFramework':
                    aVal = a.legalFramework.value;
                    bVal = b.legalFramework.value;
                    break;
                case 'services':
                    aVal = a.managementServices.value;
                    bVal = b.managementServices.value;
                    break;
                default:
                    aVal = a.countryName[window.currentLang] || a.countryName.fr;
                    bVal = b.countryName[window.currentLang] || b.countryName.fr;
            }
    
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
    
            if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    
        renderTableBusiness(filtered);
    }
    
    // Update statistics
    function updateStats() {
        const totalCountries = countryData.length;
        const permissive = countryData.filter(c => c.legalFramework.level === 'permissive' || c.legalFramework.level === 'moderate').length;
        const prohibited = countryData.filter(c => c.legalFramework.level === 'prohibited').length;
        const professional = countryData.filter(c => c.managementServices.level === 'professional').length;
    
        document.getElementById('total-countries').textContent = totalCountries;
        document.getElementById('permissive-count').textContent = permissive;
        document.getElementById('prohibited-count').textContent = prohibited;
        document.getElementById('professional-services').textContent = professional;
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', filterAndSortBusiness);

        // Filter dropdowns
        regionFilter.addEventListener('change', () => {
            currentRegionFilter = regionFilter.value;
            filterAndSortBusiness();
        });

        legalFilter.addEventListener('change', () => {
            currentLegalFilter = legalFilter.value;
            filterAndSortBusiness();
        });

        servicesFilter.addEventListener('change', () => {
            currentServicesFilter = servicesFilter.value;
            filterAndSortBusiness();
        });

        // Table sorting
        document.querySelectorAll('th.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-sort');

                if (currentSort.column === column) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = column;
                    currentSort.direction = 'asc';
                }

                // Update header classes
                document.querySelectorAll('th.sortable').forEach(h => {
                    h.classList.remove('sorted-asc', 'sorted-desc');
                });
                header.classList.add(`sorted-${currentSort.direction}`);

                filterAndSortBusiness();
            });
        });
    }

    // Initialize
    async function initVacationRentalBusiness() {
        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 50));

        // Initialize DOM elements
        tableBody = document.getElementById('tableBody');
        searchInput = document.getElementById('searchInput');
        regionFilter = document.getElementById('regionFilter');
        legalFilter = document.getElementById('legalFilter');
        servicesFilter = document.getElementById('servicesFilter');
        resultCount = document.getElementById('result-count');
        noResults = document.getElementById('no-results');

        // Check if DOM elements exist
        if (!tableBody || !searchInput || !regionFilter || !legalFilter || !servicesFilter || !resultCount || !noResults) {
            console.error('Vacation Rental Business: DOM elements not found, retrying...');
            await new Promise(resolve => setTimeout(resolve, 100));
            return initVacationRentalBusiness();
        }

        const loaded = await loadVacationRentalBusinessData();
        if (!loaded) return;

        setupEventListeners();
        updateStats();

        // Apply translations
        if (window.applyTranslations) {
            window.applyTranslations();
        }

        // Initial render
        filterAndSortBusiness();

        // Initialize unlock button in result-count area
        if (window.TooltipModule) {
            window.TooltipModule.initUnlockButton();
        }

        // Set initial sort indicator
        const sortHeader = document.querySelector('th[data-sort="country"]');
        if (sortHeader) {
            sortHeader.classList.add('sorted-asc');
        }

        // Listen for language changes and re-render table
        window.addEventListener('languageChanged', () => {
            filterAndSortBusiness();
        });
    }

    // Export init function for router
    window.initVacationRentalBusiness = initVacationRentalBusiness;

})(); // End of VacationRentalBusiness module
