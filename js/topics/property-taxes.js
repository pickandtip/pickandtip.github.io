// ==========================================
// PROPERTY TAXES TOPIC - SPECIFIC CODE
// ==========================================

(function() {
    'use strict';

    // Topic-specific state (encapsulated in module scope)
    let countries = [];
    let propertyTaxes = [];
    let taxData = [];
    let lastUpdated = '';
    let currentSort = { column: 'country', direction: 'asc' };
    let currentPropertyTaxFilter = 'all';
    let currentTransferTaxFilter = 'all';

    // DOM Elements
    let tableBody, searchInput, regionFilter, propertyTaxFilter, transferTaxFilter, resultCount, noResults;

    // ==========================================
    // DATA LOADING
    // ==========================================
    async function loadPropertyTaxesData() {
        try {
            const [countriesData, propertyTaxesData] = await Promise.all([
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.countries)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.propertyTaxes)).then(res => res.json())
            ]);

            countries = countriesData;
            lastUpdated = propertyTaxesData.lastUpdated || '2024-12';
            propertyTaxes = propertyTaxesData.countries || propertyTaxesData;

            // Merge countries with property taxes
            taxData = propertyTaxes.map(tax => {
                const country = countries.find(c => c.code === tax.countryCode);
                if (!country) {
                    console.warn(`⚠️ DATA INTEGRITY ERROR: Country code "${tax.countryCode}" referenced in property-taxes but not found in countries database`);
                    return null;
                }
                return {
                    ...tax,
                    country: country.name,
                    flag: country.flag,
                    region: country.region
                };
            }).filter(item => item !== null);

            return true;
        } catch (error) {
            console.error('Error loading property taxes data:', error);
            alert('Failed to load property taxes data. Please refresh the page.');
            return false;
        }
    }

    // Use tooltip module functions
    const createTooltipCell = window.TooltipModule.createTooltipCell;
    const setupSmartTooltip = window.TooltipModule.setupSmartTooltip;

    // ==========================================
    // TOOLTIP FORMATTING FUNCTIONS
    // ==========================================

    // Format property tax with tooltip
    function formatPropertyTaxWithTooltip(item) {
        const lang = window.currentLang;
        const propertyTax = window.replaceTokens(item.propertyTax, lang).replace(/\n/g, '<br>');
        const notes = item.propertyTaxNotes?.[lang] || '';

        const taxClass = item.propertyTaxValue === 0 ? 'tax-none' :
                         item.propertyTaxValue < 0.5 ? 'tax-low' :
                         item.propertyTaxValue < 1.5 ? 'tax-medium' : 'tax-high';

        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.propertyTaxes?.tooltips?.noAdditionalInfo || 'No additional information');

        return createTooltipCell({
            mainContent: `<span class="tax-value ${taxClass}">${propertyTax}</span>`,
            tooltipContent: tooltipContent,
            cellClass: 'property-tax-cell',
            iconClass: 'property-tax-info-icon',
            tooltipClass: 'property-tax-tooltip',
            position: 'right',
            iconFirst: false,
            isEmpty: !hasNotes
        });
    }

    // Format transfer tax with tooltip
    function formatTransferTaxWithTooltip(item) {
        const lang = window.currentLang;
        const transferTax = window.replaceTokens(item.transferTax, lang).replace(/\n/g, '<br>');
        const notes = item.transferTaxNotes?.[lang] || '';

        const transferClass = item.transferTaxValue === 0 ? 'tax-none' :
                              item.transferTaxValue < 2 ? 'tax-low' :
                              item.transferTaxValue < 5 ? 'tax-medium' : 'tax-high';

        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.propertyTaxes?.tooltips?.noAdditionalInfo || 'No additional information');

        return createTooltipCell({
            mainContent: `<span class="tax-value ${transferClass}">${transferTax}</span>`,
            tooltipContent: tooltipContent,
            cellClass: 'transfer-tax-cell',
            iconClass: 'transfer-tax-info-icon',
            tooltipClass: 'transfer-tax-tooltip',
            position: 'right',
            iconFirst: true,
            isEmpty: !hasNotes
        });
    }

    // Format foreign access with tooltip
    function formatForeignAccessWithTooltip(item) {
        const lang = window.currentLang;
        const foreignLevel = item.foreignerRestrictionLevel || 'unrestricted';
        const foreignClass = `foreign-${foreignLevel}`;
        const foreignText = window.translations[lang].foreignerRestriction[foreignLevel] || foreignLevel;
        const notes = item.foreignAccessNotes?.[lang] || '';

        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.propertyTaxes?.tooltips?.noAdditionalInfo || 'No additional information');

        return createTooltipCell({
            mainContent: `<span class="foreign-badge ${foreignClass}">${foreignText}</span>`,
            tooltipContent: tooltipContent,
            cellClass: 'foreign-access-cell',
            iconClass: 'foreign-access-info-icon',
            tooltipClass: 'foreign-access-tooltip',
            position: 'right',
            iconFirst: true,
            isEmpty: !hasNotes
        });
    }

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
            position: 'right',
            iconFirst: true,
            isEmpty: false
        });
    }

    // Format country name with general notes tooltip
    function formatCountryWithTooltip(item) {
        const lang = window.currentLang;
        const countryName = item.country[lang];
        const notes = item.countryGeneralNotes?.[lang] || '';
        const warningHtml = formatCountryWarning(item);

        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.propertyTaxes?.tooltips?.noAdditionalInfo || 'No additional information');

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
            position: 'right',
            iconFirst: false,
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

            const regionClass = item.region.toLowerCase().replace('-', '');
            const regionName = window.translations[window.currentLang].regions[item.region] || item.region;

            row.innerHTML = `
                <td class="country-td">${formatCountryWithTooltip(item)}</td>
                <td><span class="region-badge region-${regionClass}">${regionName}</span></td>
                <td class="property-tax-td">${formatPropertyTaxWithTooltip(item)}</td>
                <td class="transfer-tax-td">${formatTransferTaxWithTooltip(item)}</td>
                <td class="foreign-access-td">${formatForeignAccessWithTooltip(item)}</td>
            `;

            // Initialize tooltips using the unified module
            window.TooltipModule.initializeTooltips(row);

            tableBody.appendChild(row);
        });
    }

    function filterAndSort() {
        let filtered = [...taxData];

        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.country[window.currentLang].toLowerCase().includes(searchTerm) ||
                item.country.fr.toLowerCase().includes(searchTerm) ||
                item.country.en.toLowerCase().includes(searchTerm) ||
                window.translations[window.currentLang].regions[item.region]?.toLowerCase().includes(searchTerm)
            );
        }

        const region = regionFilter.value;
        if (region) {
            filtered = filtered.filter(item => item.region === region);
        }

        // Property tax filter
        if (currentPropertyTaxFilter === 'none') {
            filtered = filtered.filter(item => item.propertyTaxValue === 0);
        } else if (currentPropertyTaxFilter === 'low') {
            filtered = filtered.filter(item => item.propertyTaxValue > 0 && item.propertyTaxValue < 0.5);
        } else if (currentPropertyTaxFilter === 'medium') {
            filtered = filtered.filter(item => item.propertyTaxValue >= 0.5 && item.propertyTaxValue <= 1.5);
        } else if (currentPropertyTaxFilter === 'high') {
            filtered = filtered.filter(item => item.propertyTaxValue > 1.5);
        }

        // Transfer tax filter
        if (currentTransferTaxFilter === 'none') {
            filtered = filtered.filter(item => item.transferTaxValue === 0);
        } else if (currentTransferTaxFilter === 'low') {
            filtered = filtered.filter(item => item.transferTaxValue > 0 && item.transferTaxValue < 2);
        } else if (currentTransferTaxFilter === 'medium') {
            filtered = filtered.filter(item => item.transferTaxValue >= 2 && item.transferTaxValue <= 5);
        } else if (currentTransferTaxFilter === 'high') {
            filtered = filtered.filter(item => item.transferTaxValue > 5);
        }

        filtered.sort((a, b) => {
            let valA, valB;

            switch(currentSort.column) {
                case 'country':
                    valA = a.country[window.currentLang];
                    valB = b.country[window.currentLang];
                    break;
                case 'region':
                    valA = a.region;
                    valB = b.region;
                    break;
                case 'propertyTax':
                    valA = a.propertyTaxValue;
                    valB = b.propertyTaxValue;
                    break;
                case 'transferTax':
                    valA = a.transferTaxValue;
                    valB = b.transferTaxValue;
                    break;
                case 'foreignerRestrictionLevel':
                    valA = a.foreignerRestrictionValue || 0;
                    valB = b.foreignerRestrictionValue || 0;
                    break;
                default:
                    valA = a.country[window.currentLang];
                    valB = b.country[window.currentLang];
            }

            if (typeof valA === 'string') {
                return currentSort.direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return currentSort.direction === 'asc'
                ? valA - valB
                : valB - valA;
        });

        renderTable(filtered);
    }

    // ==========================================
    // EVENT LISTENERS SETUP
    // ==========================================
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', filterAndSort);

        // Region filter
        regionFilter.addEventListener('change', filterAndSort);

        // Property tax filter
        propertyTaxFilter.addEventListener('change', () => {
            currentPropertyTaxFilter = propertyTaxFilter.value;
            filterAndSort();
        });

        // Transfer tax filter
        transferTaxFilter.addEventListener('change', () => {
            currentTransferTaxFilter = transferTaxFilter.value;
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

        // Listen for language changes and re-render table
        window.addEventListener('languageChanged', () => {
            filterAndSort();
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    // ==========================================
    // STATISTICS UPDATE
    // ==========================================
    function updateStats() {
        document.getElementById('countryCount').textContent = taxData.length;
        document.getElementById('noTaxCount').textContent = taxData.filter(d => d.propertyTaxValue === 0).length;
        document.getElementById('lowTaxCount').textContent = taxData.filter(d => d.propertyTaxValue > 0 && d.propertyTaxValue < 0.5).length;
        document.getElementById('noTransferTaxCount').textContent = taxData.filter(d => d.transferTaxValue === 0).length;
        document.getElementById('lowTransferTaxCount').textContent = taxData.filter(d => d.transferTaxValue > 0 && d.transferTaxValue < 2).length;

        // Format and display last updated date (MM/YYYY format)
        const [year, month] = lastUpdated.split('-');
        document.getElementById('lastUpdated').textContent = `${month}/${year}`;
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    async function initPropertyTaxes() {
        // Initialize DOM elements
        tableBody = document.getElementById('tableBody');
        searchInput = document.getElementById('searchInput');
        regionFilter = document.getElementById('regionFilter');
        propertyTaxFilter = document.getElementById('propertyTaxFilter');
        transferTaxFilter = document.getElementById('transferTaxFilter');
        resultCount = document.getElementById('resultCount');
        noResults = document.getElementById('noResults');

        // Load data
        const loaded = await loadPropertyTaxesData();
        if (!loaded) return;

        // Setup event listeners
        setupEventListeners();

        // Update statistics
        updateStats();

        // Apply translations to current view
        window.applyTranslations();

        // Render initial table
        filterAndSort();

        // Initialize unlock button in result-count area
        if (window.TooltipModule) {
            window.TooltipModule.initUnlockButton();
        }

        // Set initial sort indicator
        document.querySelector('th[data-sort="country"]').classList.add('sorted-asc');
    }

    // Export init function for router
    window.initPropertyTaxes = initPropertyTaxes;

})(); // End of PropertyTaxes module
