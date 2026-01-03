// ==========================================
// VAT (TVA) TOPIC - SPECIFIC CODE
// ==========================================

(function() {
    'use strict';

    // Topic-specific state (encapsulated in module scope)
    let countries = [];
    let vatRates = [];
    let vatData = [];
    let lastUpdated = '';
    let currentSort = { column: 'country', direction: 'asc' };
    let currentVatRateFilter = 'all';
    let currentReducedRatesFilter = 'all';

    // DOM Elements
    let tableBody, searchInput, regionFilter, vatRateFilter, reducedRatesFilter, resultCount, noResults;

    // VAT rate level mapping
    const vatLevels = {
        none: { min: 0, max: 0, label: { fr: 'Aucune', en: 'None' }, color: '#4CAF50' },
        low: { min: 0.01, max: 10, label: { fr: 'Faible', en: 'Low' }, color: '#8BC34A' },
        medium: { min: 10.01, max: 20, label: { fr: 'Modéré', en: 'Medium' }, color: '#FF9800' },
        high: { min: 20.01, max: 100, label: { fr: 'Élevé', en: 'High' }, color: '#F44336' }
    };

    // ==========================================
    // DATA LOADING
    // ==========================================
    async function loadVatData() {
        try {
            const [countriesData, vatRatesData] = await Promise.all([
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.countries)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.vat)).then(res => res.json())
            ]);

            countries = countriesData;
            lastUpdated = vatRatesData.lastUpdated || '2025-01';
            vatRates = vatRatesData.countries || vatRatesData;

            // Merge with country data
            vatData = vatRates.map(vat => {
                const country = countries.find(c => c.code === vat.countryCode);
                if (!country) {
                    console.warn(`Country not found for code: ${vat.countryCode}`);
                    return null;
                }
                return {
                    ...vat,
                    countryName: country.name,
                    flag: country.flag,
                    region: country.region
                };
            }).filter(item => item !== null);

            return true;
        } catch (error) {
            console.error('Error loading VAT data:', error);
            alert('Failed to load VAT data. Please refresh the page.');
            return false;
        }
    }

    // ==========================================
    // RENDERING HELPERS
    // ==========================================

    // Get VAT rate badge with color coding
    function getVatBadge(rate) {
        let level = 'none';
        if (rate > 20) level = 'high';
        else if (rate > 10) level = 'medium';
        else if (rate > 0) level = 'low';

        const config = vatLevels[level];
        return `<span class="vat-badge" style="background-color: ${config.color}">${rate}%</span>`;
    }

    // Check if a jurisdiction has actual reduced rates (not just [0])
    function hasReducedRates(rates) {
        if (!rates || rates.length === 0) return false;
        return rates.some(r => r > 0);
    }

    // Format reduced rates as tags
    function formatReducedRates(rates) {
        if (!rates || rates.length === 0) {
            return '<span style="color: #999;">—</span>';
        }

        // Filter out 0% rates (placeholder for no reduced rates)
        const validRates = rates.filter(r => r > 0);

        if (validRates.length === 0) {
            return '<span style="color: #999;">—</span>';
        }

        return validRates.map(r => `<span class="reduced-rate-tag">${r}%</span>`).join(' ');
    }

    // Format threshold with language support
    function formatThreshold(threshold, lang) {
        if (!threshold || threshold === 0) {
            return '<span style="color: #999;">—</span>';
        }
        const display = threshold[lang] || threshold.fr;
        return `<span class="threshold-value">${display}</span>`;
    }

    // Use tooltip module functions
    const createTooltipCell = window.TooltipModule.createTooltipCell;
    const setupSmartTooltip = window.TooltipModule.setupSmartTooltip;

    // ==========================================
    // TOOLTIP FORMATTING FUNCTIONS
    // ==========================================

    // Format country warning triangle (if warnings exist)
    function formatCountryWarning(item) {
        const lang = window.currentLang;
        const warnings = item.countryWarnings?.[lang] || '';

        if (!warnings || warnings.trim() === '') {
            return ''; // No warning triangle
        }

        return createTooltipCell({
            mainContent: '',
            tooltipContent: warnings,
            cellClass: 'country-warning-cell',
            iconClass: 'country-warning-icon',
            tooltipClass: 'country-warning-tooltip',
            iconFirst: true,
            isEmpty: false
        });
    }

    // Format country name with system notes tooltip
    function formatCountryWithTooltip(item) {
        const lang = window.currentLang;
        const countryName = item.countryName[lang];
        const notes = item.systemNotes?.[lang] || '';
        const warningHtml = formatCountryWarning(item);

        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.vat?.tooltips?.noAdditionalInfo || 'No additional information');

        return createTooltipCell({
            mainContent: `
                ${warningHtml}
                <div class="country-cell-content">
                    <span class="flag">${item.flag}</span>
                    <span>${countryName}</span>
                </div>
            `,
            tooltipContent: tooltipContent,
            cellClass: 'country-with-tooltip-cell',
            iconClass: 'country-info-icon',
            tooltipClass: 'country-tooltip',
            iconFirst: false,
            isEmpty: !hasNotes
        });
    }

    // Format standard rate with tooltip
    function formatStandardRateWithTooltip(item) {
        const lang = window.currentLang;
        const notes = item.standardRateNotes?.[lang] || '';
        const badge = getVatBadge(item.standardRate);

        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.vat?.tooltips?.noAdditionalInfo || 'No additional information');

        return createTooltipCell({
            mainContent: badge,
            tooltipContent: tooltipContent,
            cellClass: 'standard-rate-cell',
            iconClass: 'standard-rate-info-icon',
            tooltipClass: 'standard-rate-tooltip',
            iconFirst: false,
            isEmpty: !hasNotes
        });
    }

    // Format reduced rates with tooltip
    function formatReducedRatesWithTooltip(item) {
        const lang = window.currentLang;
        const notes = item.reducedRatesNotes?.[lang] || '';
        const ratesHtml = formatReducedRates(item.reducedRates);

        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.vat?.tooltips?.noAdditionalInfo || 'No additional information');

        return createTooltipCell({
            mainContent: ratesHtml,
            tooltipContent: tooltipContent,
            cellClass: 'reduced-rates-cell',
            iconClass: 'reduced-rates-info-icon',
            tooltipClass: 'reduced-rates-tooltip',
            iconFirst: true,
            isEmpty: !hasNotes
        });
    }

    // Format threshold with tooltip
    function formatThresholdWithTooltip(item) {
        const lang = window.currentLang;
        const notes = item.thresholdNotes?.[lang] || '';
        const thresholdHtml = formatThreshold(item.registrationThreshold, lang);

        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.vat?.tooltips?.noAdditionalInfo || 'No additional information');

        return createTooltipCell({
            mainContent: thresholdHtml,
            tooltipContent: tooltipContent,
            cellClass: 'threshold-cell',
            iconClass: 'threshold-info-icon',
            tooltipClass: 'threshold-tooltip',
            iconFirst: true,
            isEmpty: !hasNotes
        });
    }

    // ==========================================
    // TABLE RENDERING
    // ==========================================
    function renderTable(data) {
        tableBody.innerHTML = '';

        if (data.length === 0) {
            noResults.classList.remove('hidden');
            resultCount.textContent = '0';
            return;
        }

        noResults.classList.add('hidden');
        resultCount.textContent = data.length;

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.animationDelay = `${index * 0.02}s`;

            const regionLabel = window.translations?.regions?.[item.region] || item.region;

            row.innerHTML = `
                <td class="country-td">${formatCountryWithTooltip(item)}</td>
                <td>${regionLabel}</td>
                <td class="standard-rate-td">${formatStandardRateWithTooltip(item)}</td>
                <td class="reduced-rates-td">${formatReducedRatesWithTooltip(item)}</td>
                <td class="threshold-td">${formatThresholdWithTooltip(item)}</td>
            `;

            // Initialize tooltips using the unified module
            window.TooltipModule.initializeTooltips(row);

            tableBody.appendChild(row);
        });
    }

    // ==========================================
    // FILTERING AND SORTING
    // ==========================================
    function filterAndSort() {
        let filtered = [...vatData];

        // Search filter
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.countryName.fr.toLowerCase().includes(searchTerm) ||
                item.countryName.en.toLowerCase().includes(searchTerm) ||
                window.translations[window.currentLang].regions[item.region]?.toLowerCase().includes(searchTerm)
            );
        }

        // Region filter
        const region = regionFilter.value;
        if (region) {
            filtered = filtered.filter(item => item.region === region);
        }

        // VAT rate filter
        if (currentVatRateFilter === 'none') {
            filtered = filtered.filter(item => item.standardRate === 0);
        } else if (currentVatRateFilter === 'low') {
            filtered = filtered.filter(item => item.standardRate > 0 && item.standardRate <= 10);
        } else if (currentVatRateFilter === 'medium') {
            filtered = filtered.filter(item => item.standardRate > 10 && item.standardRate <= 20);
        } else if (currentVatRateFilter === 'high') {
            filtered = filtered.filter(item => item.standardRate > 20);
        }

        // Reduced rates filter
        if (currentReducedRatesFilter === 'yes') {
            filtered = filtered.filter(item => hasReducedRates(item.reducedRates));
        } else if (currentReducedRatesFilter === 'no') {
            filtered = filtered.filter(item => !hasReducedRates(item.reducedRates));
        }

        // Sort
        filtered.sort((a, b) => {
            let valA, valB;

            switch(currentSort.column) {
                case 'country':
                    valA = a.countryName[window.currentLang] || a.countryName.fr;
                    valB = b.countryName[window.currentLang] || b.countryName.fr;
                    break;
                case 'region':
                    valA = a.region;
                    valB = b.region;
                    break;
                case 'standardRate':
                    valA = a.standardRate;
                    valB = b.standardRate;
                    break;
                case 'reducedRates':
                    // Sort by highest reduced rate (0 if none)
                    const validRatesA = a.reducedRates ? a.reducedRates.filter(r => r > 0) : [];
                    const validRatesB = b.reducedRates ? b.reducedRates.filter(r => r > 0) : [];
                    valA = validRatesA.length > 0 ? Math.max(...validRatesA) : -1;
                    valB = validRatesB.length > 0 ? Math.max(...validRatesB) : -1;
                    break;
                case 'threshold':
                    valA = a.registrationThresholdValue || 0;
                    valB = b.registrationThresholdValue || 0;
                    break;
                default:
                    valA = a.countryName[window.currentLang] || a.countryName.fr;
                    valB = b.countryName[window.currentLang] || b.countryName.fr;
            }

            if (typeof valA === 'string') {
                return currentSort.direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return currentSort.direction === 'asc' ? valA - valB : valB - valA;
        });

        renderTable(filtered);
    }

    // ==========================================
    // STATISTICS UPDATE
    // ==========================================
    function updateStats() {
        document.getElementById('countryCount').textContent = vatData.length;
        document.getElementById('noVatCount').textContent = vatData.filter(d => d.standardRate === 0).length;
        document.getElementById('lowVatCount').textContent = vatData.filter(d => d.standardRate > 0 && d.standardRate <= 10).length;

        const avgVat = (vatData.reduce((sum, d) => sum + d.standardRate, 0) / vatData.length).toFixed(1);
        document.getElementById('avgVatRate').textContent = `${avgVat}%`;

        document.getElementById('reducedRatesCount').textContent = vatData.filter(d => hasReducedRates(d.reducedRates)).length;

        // Format and display last updated date (MM/YYYY format)
        const [year, month] = lastUpdated.split('-');
        document.getElementById('lastUpdated').textContent = `${month}/${year}`;
    }

    // ==========================================
    // EVENT LISTENERS SETUP
    // ==========================================
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', filterAndSort);

        // Region filter
        regionFilter.addEventListener('change', filterAndSort);

        // VAT rate filter
        vatRateFilter.addEventListener('change', () => {
            currentVatRateFilter = vatRateFilter.value;
            filterAndSort();
        });

        // Reduced rates filter
        reducedRatesFilter.addEventListener('change', () => {
            currentReducedRatesFilter = reducedRatesFilter.value;
            filterAndSort();
        });

        // Table sorting
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.sort;

                document.querySelectorAll('th').forEach(h => {
                    h.classList.remove('sorted-asc', 'sorted-desc');
                });

                if (currentSort.column === column) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = column;
                    currentSort.direction = 'asc';
                }

                th.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
                filterAndSort();
            });
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    async function initVat() {
        // Initialize DOM elements
        tableBody = document.getElementById('tableBody');
        searchInput = document.getElementById('searchInput');
        regionFilter = document.getElementById('regionFilter');
        vatRateFilter = document.getElementById('vatRateFilter');
        reducedRatesFilter = document.getElementById('reducedRatesFilter');
        resultCount = document.getElementById('resultCount');
        noResults = document.getElementById('noResults');

        // Load data
        const loaded = await loadVatData();
        if (!loaded) return;

        // Setup event listeners
        setupEventListeners();

        // Update statistics
        updateStats();

        // Apply translations to current view
        if (window.applyTranslations) {
            window.applyTranslations();
        }

        // Render initial table
        filterAndSort();

        // Set initial sort indicator
        const sortHeader = document.querySelector('th[data-sort="country"]');
        if (sortHeader) {
            sortHeader.classList.add('sorted-asc');
        }

        // Listen for language changes and re-render table
        window.addEventListener('languageChanged', () => {
            filterAndSort();
        });
    }

    // Export init function for router
    window.initVat = initVat;

})(); // End of VAT module
