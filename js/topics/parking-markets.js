// ==========================================
// PARKING MARKETS TOPIC - SPECIFIC CODE
// ==========================================

(function() {
    'use strict';

    // Topic-specific state
    let countries = [];
    let commonData = [];
    let garageData = [];
    let indoorData = [];
    let outdoorData = [];

    // Merged datasets (common + specific data)
    let legalData = [];
    let garageMarkets = [];
    let indoorMarkets = [];
    let outdoorMarkets = [];

    let currentTab = 'legal';

    // Current sort and filter state per tab
    const tabStates = {
        legal: {
            sort: { column: 'country', direction: 'asc' },
            filters: { search: '', region: 'all', access: 'all' }
        },
        garage: {
            sort: { column: 'country', direction: 'asc' },
            filters: { search: '', region: 'all', yield: 'all' }
        },
        indoor: {
            sort: { column: 'country', direction: 'asc' },
            filters: { search: '', region: 'all', yield: 'all' }
        },
        outdoor: {
            sort: { column: 'country', direction: 'asc' },
            filters: { search: '', region: 'all', yield: 'all' }
        }
    };

    // ==========================================
    // DATA LOADING
    // ==========================================
    async function loadParkingMarketsData() {
        try {
            const [countriesData, commonResponse, garageResponse, indoorResponse, outdoorResponse] = await Promise.all([
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.countries)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.parkingCommon)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.parkingGarage)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.parkingIndoor)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.parkingOutdoor)).then(res => res.json())
            ]);

            countries = countriesData.results || countriesData;
            commonData = commonResponse.markets || [];
            garageData = garageResponse.markets || [];
            indoorData = indoorResponse.markets || [];
            outdoorData = outdoorResponse.markets || [];

            // Merge common data with specific data for each type
            legalData = mergeWithCountries(commonData, 'legal');
            garageMarkets = mergeMarketsData(commonData, garageData, 'garage');
            indoorMarkets = mergeMarketsData(commonData, indoorData, 'indoor');
            outdoorMarkets = mergeMarketsData(commonData, outdoorData, 'outdoor');

            return true;
        } catch (error) {
            console.error('Error loading parking markets data:', error);
            alert('Failed to load parking markets data. Please refresh the page.');
            return false;
        }
    }

    // Merge common data with countries info (for legal tab)
    function mergeWithCountries(commonMarkets, type) {
        return commonMarkets.map(market => {
            const country = countries.find(c => c.code === market.countryCode);
            if (!country) {
                console.warn(`⚠️ Country code "${market.countryCode}" not found in countries database`);
                return null;
            }
            return {
                ...market,
                country: {
                    fr: country.nameFr,
                    en: country.nameEn
                },
                flag: country.flag,
                region: country.region
            };
        }).filter(item => item !== null);
    }

    // Merge common data with profitability data (for garage/indoor/outdoor tabs)
    function mergeMarketsData(commonMarkets, profitabilityMarkets, type) {
        return profitabilityMarkets.map(profMarket => {
            const commonMarket = commonMarkets.find(c => c.countryCode === profMarket.countryCode);
            const country = countries.find(c => c.code === profMarket.countryCode);

            if (!country) {
                console.warn(`⚠️ Country code "${profMarket.countryCode}" not found in countries database`);
                return null;
            }

            return {
                countryCode: profMarket.countryCode,
                country: {
                    fr: country.nameFr,
                    en: country.nameEn
                },
                flag: country.flag,
                region: country.region,
                profitability: profMarket.profitability,
                // Include common data if available
                riskProfile: commonMarket?.riskProfile,
                legalFramework: commonMarket?.legalFramework,
                taxation: commonMarket?.taxation
            };
        }).filter(item => item !== null);
    }

    // ==========================================
    // TAB SWITCHING
    // ==========================================
    function switchTab(tabName) {
        // Update active states
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activate selected tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');

        currentTab = tabName;

        // Render the selected tab
        renderCurrentTab();
    }

    function renderCurrentTab() {
        switch(currentTab) {
            case 'legal':
                updateLegalStats();
                filterAndSortLegal();
                break;
            case 'garage':
                updateGarageStats();
                filterAndSortGarage();
                break;
            case 'indoor':
                updateIndoorStats();
                filterAndSortIndoor();
                break;
            case 'outdoor':
                updateOutdoorStats();
                filterAndSortOutdoor();
                break;
        }
    }

    // ==========================================
    // LEGAL TAB - RENDERING
    // ==========================================
    function filterAndSortLegal() {
        const state = tabStates.legal;
        let filtered = [...legalData];

        // Search filter
        if (state.filters.search) {
            const searchTerm = state.filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.country[window.currentLang].toLowerCase().includes(searchTerm) ||
                item.country.fr.toLowerCase().includes(searchTerm) ||
                item.country.en.toLowerCase().includes(searchTerm)
            );
        }

        // Region filter
        if (state.filters.region !== 'all') {
            filtered = filtered.filter(item => item.region === state.filters.region);
        }

        // Foreign access filter
        if (state.filters.access !== 'all') {
            filtered = filtered.filter(item =>
                item.legalFramework?.foreignAccess?.level === state.filters.access
            );
        }

        // Sorting
        filtered.sort((a, b) => sortComparator(a, b, state.sort));

        renderLegalTable(filtered);
        document.getElementById('legal-result-count').textContent = filtered.length;
        document.getElementById('legal-no-results').classList.toggle('hidden', filtered.length > 0);
    }

    function renderLegalTable(data) {
        const tbody = document.getElementById('legal-table-body');
        tbody.innerHTML = '';

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.animationDelay = `${index * 0.02}s`;

            const lang = window.currentLang;
            const regionClass = item.region.toLowerCase().replace('-', '');
            const regionName = window.translations[lang].regions[item.region] || item.region;

            // Risk Profile badge
            const riskProfile = item.riskProfile || { type: 'unknown', color: 'gray', label: { fr: 'N/A', en: 'N/A' }};
            const riskBadge = `<span class="risk-badge risk-${riskProfile.type}" style="background: ${riskProfile.color}20; color: ${riskProfile.color};">
                ${riskProfile.label[lang]}
            </span>`;

            // Foreign Access badge
            const foreignAccess = item.legalFramework?.foreignAccess || { level: 'unknown', icon: '❓', label: { fr: 'N/A', en: 'N/A' }};
            const accessBadge = `<span class="access-badge access-${foreignAccess.level}">
                ${foreignAccess.icon} ${foreignAccess.label[lang]}
            </span>`;

            // Legal Framework summary
            const legalSummary = item.legalFramework?.restrictions?.[lang] || 'N/A';

            // Taxation summary
            const taxationSummary = item.taxation?.summary?.[lang] || 'N/A';

            // Platforms count
            const platformsCount = item.platforms?.count || 0;
            const platformsDisplay = platformsCount > 0 ?
                `${item.platforms.icon} ${platformsCount} ${lang === 'fr' ? 'plateformes' : 'platforms'}` :
                'N/A';

            row.innerHTML = `
                <td><span class="flag">${item.flag}</span> ${item.country[lang]}</td>
                <td><span class="region-badge region-${regionClass}">${regionName}</span></td>
                <td>${riskBadge}</td>
                <td>${accessBadge}</td>
                <td class="small-text">${legalSummary}</td>
                <td class="small-text">${taxationSummary}</td>
                <td class="center">${platformsDisplay}</td>
            `;

            tbody.appendChild(row);
        });
    }

    function updateLegalStats() {
        document.getElementById('legal-countries-count').textContent = legalData.length;

        const unrestrictedCount = legalData.filter(d =>
            d.legalFramework?.foreignAccess?.level === 'unrestricted'
        ).length;
        document.getElementById('legal-unrestricted-count').textContent = unrestrictedCount;

        // Average tax calculation would go here
        document.getElementById('legal-avg-tax').textContent = 'N/A';
    }

    // ==========================================
    // GARAGE TAB - RENDERING
    // ==========================================
    function filterAndSortGarage() {
        const state = tabStates.garage;
        let filtered = [...garageMarkets];

        // Search filter
        if (state.filters.search) {
            const searchTerm = state.filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.country[window.currentLang].toLowerCase().includes(searchTerm)
            );
        }

        // Region filter
        if (state.filters.region !== 'all') {
            filtered = filtered.filter(item => item.region === state.filters.region);
        }

        // Yield filter
        if (state.filters.yield === 'high') {
            filtered = filtered.filter(item =>
                (item.profitability?.yields?.longTerm?.min || 0) >= 5
            );
        } else if (state.filters.yield === 'medium') {
            filtered = filtered.filter(item => {
                const yield_ = item.profitability?.yields?.longTerm?.min || 0;
                return yield_ >= 3 && yield_ < 5;
            });
        } else if (state.filters.yield === 'low') {
            filtered = filtered.filter(item =>
                (item.profitability?.yields?.longTerm?.min || 0) < 3
            );
        }

        // Sorting
        filtered.sort((a, b) => sortComparator(a, b, state.sort));

        renderProfitabilityTable(filtered, 'garage');
        document.getElementById('garage-result-count').textContent = filtered.length;
        document.getElementById('garage-no-results').classList.toggle('hidden', filtered.length > 0);
    }

    // ==========================================
    // INDOOR TAB - RENDERING
    // ==========================================
    function filterAndSortIndoor() {
        const state = tabStates.indoor;
        let filtered = [...indoorMarkets];

        // Apply same filters as garage
        if (state.filters.search) {
            const searchTerm = state.filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.country[window.currentLang].toLowerCase().includes(searchTerm)
            );
        }

        if (state.filters.region !== 'all') {
            filtered = filtered.filter(item => item.region === state.filters.region);
        }

        if (state.filters.yield === 'high') {
            filtered = filtered.filter(item =>
                (item.profitability?.yields?.longTerm?.min || 0) >= 5
            );
        } else if (state.filters.yield === 'medium') {
            filtered = filtered.filter(item => {
                const yield_ = item.profitability?.yields?.longTerm?.min || 0;
                return yield_ >= 3 && yield_ < 5;
            });
        } else if (state.filters.yield === 'low') {
            filtered = filtered.filter(item =>
                (item.profitability?.yields?.longTerm?.min || 0) < 3
            );
        }

        filtered.sort((a, b) => sortComparator(a, b, state.sort));

        renderProfitabilityTable(filtered, 'indoor');
        document.getElementById('indoor-result-count').textContent = filtered.length;
        document.getElementById('indoor-no-results').classList.toggle('hidden', filtered.length > 0);
    }

    // ==========================================
    // OUTDOOR TAB - RENDERING
    // ==========================================
    function filterAndSortOutdoor() {
        const state = tabStates.outdoor;
        let filtered = [...outdoorMarkets];

        // Apply same filters as garage
        if (state.filters.search) {
            const searchTerm = state.filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.country[window.currentLang].toLowerCase().includes(searchTerm)
            );
        }

        if (state.filters.region !== 'all') {
            filtered = filtered.filter(item => item.region === state.filters.region);
        }

        if (state.filters.yield === 'high') {
            filtered = filtered.filter(item =>
                (item.profitability?.yields?.longTerm?.min || 0) >= 5
            );
        } else if (state.filters.yield === 'medium') {
            filtered = filtered.filter(item => {
                const yield_ = item.profitability?.yields?.longTerm?.min || 0;
                return yield_ >= 3 && yield_ < 5;
            });
        } else if (state.filters.yield === 'low') {
            filtered = filtered.filter(item =>
                (item.profitability?.yields?.longTerm?.min || 0) < 3
            );
        }

        filtered.sort((a, b) => sortComparator(a, b, state.sort));

        renderProfitabilityTable(filtered, 'outdoor');
        document.getElementById('outdoor-result-count').textContent = filtered.length;
        document.getElementById('outdoor-no-results').classList.toggle('hidden', filtered.length > 0);
    }

    // ==========================================
    // SHARED PROFITABILITY TABLE RENDERER
    // ==========================================
    function renderProfitabilityTable(data, type) {
        const tbody = document.getElementById(`${type}-table-body`);
        tbody.innerHTML = '';

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.style.animationDelay = `${index * 0.02}s`;

            const lang = window.currentLang;
            const regionClass = item.region.toLowerCase().replace('-', '');
            const regionName = window.translations[lang].regions[item.region] || item.region;

            const prof = item.profitability || {};
            const prices = prof.prices || {};
            const yields = prof.yields || {};
            const liquidity = prof.marketLiquidity || {};

            // Price range
            const priceDisplay = prices.display || 'N/A';

            // Long-term yield
            const longTermYield = yields.longTerm?.display || 'N/A';

            // Short-term yield
            const shortTermYield = yields.shortTerm?.display || 'N/A';

            // Liquidity
            const liquidityDisplay = liquidity.icon ?
                `${liquidity.icon} ${liquidity.label?.[lang] || ''}` :
                'N/A';

            row.innerHTML = `
                <td><span class="flag">${item.flag}</span> ${item.country[lang]}</td>
                <td><span class="region-badge region-${regionClass}">${regionName}</span></td>
                <td><strong>${priceDisplay}</strong></td>
                <td class="yield-value">${longTermYield}</td>
                <td class="yield-value">${shortTermYield}</td>
                <td class="center">${liquidityDisplay}</td>
            `;

            tbody.appendChild(row);
        });
    }

    function updateGarageStats() {
        document.getElementById('garage-countries-count').textContent = garageMarkets.length;

        // Calculate average yield
        const avgYield = calculateAverageYield(garageMarkets);
        document.getElementById('garage-avg-yield').textContent = avgYield;

        // Calculate average price
        const avgPrice = calculateAveragePrice(garageMarkets);
        document.getElementById('garage-avg-price').textContent = avgPrice;
    }

    function updateIndoorStats() {
        document.getElementById('indoor-countries-count').textContent = indoorMarkets.length;

        const avgYield = calculateAverageYield(indoorMarkets);
        document.getElementById('indoor-avg-yield').textContent = avgYield;

        const avgPrice = calculateAveragePrice(indoorMarkets);
        document.getElementById('indoor-avg-price').textContent = avgPrice;
    }

    function updateOutdoorStats() {
        document.getElementById('outdoor-countries-count').textContent = outdoorMarkets.length;

        const avgYield = calculateAverageYield(outdoorMarkets);
        document.getElementById('outdoor-avg-yield').textContent = avgYield;

        const avgPrice = calculateAveragePrice(outdoorMarkets);
        document.getElementById('outdoor-avg-price').textContent = avgPrice;
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    function calculateAverageYield(markets) {
        if (markets.length === 0) return 'N/A';

        const yields = markets
            .map(m => m.profitability?.yields?.longTerm?.min)
            .filter(y => y != null);

        if (yields.length === 0) return 'N/A';

        const avg = yields.reduce((sum, y) => sum + y, 0) / yields.length;
        return `${avg.toFixed(1)}%`;
    }

    function calculateAveragePrice(markets) {
        if (markets.length === 0) return 'N/A';

        const prices = markets
            .map(m => m.profitability?.prices?.min)
            .filter(p => p != null);

        if (prices.length === 0) return 'N/A';

        const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        return `$${Math.round(avg / 1000)}k`;
    }

    function sortComparator(a, b, sortState) {
        let valA, valB;

        switch(sortState.column) {
            case 'country':
                valA = a.country[window.currentLang];
                valB = b.country[window.currentLang];
                break;
            case 'region':
                valA = a.region;
                valB = b.region;
                break;
            case 'priceRange':
                valA = a.profitability?.prices?.min || 0;
                valB = b.profitability?.prices?.min || 0;
                break;
            case 'longTermYield':
                valA = a.profitability?.yields?.longTerm?.min || 0;
                valB = b.profitability?.yields?.longTerm?.min || 0;
                break;
            case 'shortTermYield':
                valA = a.profitability?.yields?.shortTerm?.min || 0;
                valB = b.profitability?.yields?.shortTerm?.min || 0;
                break;
            case 'liquidity':
                valA = a.profitability?.marketLiquidity?.value || 0;
                valB = b.profitability?.marketLiquidity?.value || 0;
                break;
            default:
                valA = a.country[window.currentLang];
                valB = b.country[window.currentLang];
        }

        if (typeof valA === 'string') {
            return sortState.direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }

        return sortState.direction === 'asc'
            ? valA - valB
            : valB - valA;
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    function setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                switchTab(tabName);
            });
        });

        // Legal tab listeners
        document.getElementById('legal-search').addEventListener('input', (e) => {
            tabStates.legal.filters.search = e.target.value;
            filterAndSortLegal();
        });

        document.getElementById('legal-region-filter').addEventListener('change', (e) => {
            tabStates.legal.filters.region = e.target.value;
            filterAndSortLegal();
        });

        document.getElementById('legal-access-filter').addEventListener('change', (e) => {
            tabStates.legal.filters.access = e.target.value;
            filterAndSortLegal();
        });

        // Garage tab listeners
        document.getElementById('garage-search').addEventListener('input', (e) => {
            tabStates.garage.filters.search = e.target.value;
            filterAndSortGarage();
        });

        document.getElementById('garage-region-filter').addEventListener('change', (e) => {
            tabStates.garage.filters.region = e.target.value;
            filterAndSortGarage();
        });

        document.getElementById('garage-yield-filter').addEventListener('change', (e) => {
            tabStates.garage.filters.yield = e.target.value;
            filterAndSortGarage();
        });

        // Indoor tab listeners
        document.getElementById('indoor-search').addEventListener('input', (e) => {
            tabStates.indoor.filters.search = e.target.value;
            filterAndSortIndoor();
        });

        document.getElementById('indoor-region-filter').addEventListener('change', (e) => {
            tabStates.indoor.filters.region = e.target.value;
            filterAndSortIndoor();
        });

        document.getElementById('indoor-yield-filter').addEventListener('change', (e) => {
            tabStates.indoor.filters.yield = e.target.value;
            filterAndSortIndoor();
        });

        // Outdoor tab listeners
        document.getElementById('outdoor-search').addEventListener('input', (e) => {
            tabStates.outdoor.filters.search = e.target.value;
            filterAndSortOutdoor();
        });

        document.getElementById('outdoor-region-filter').addEventListener('change', (e) => {
            tabStates.outdoor.filters.region = e.target.value;
            filterAndSortOutdoor();
        });

        document.getElementById('outdoor-yield-filter').addEventListener('change', (e) => {
            tabStates.outdoor.filters.yield = e.target.value;
            filterAndSortOutdoor();
        });

        // Table sorting for all tabs
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.sort;
                const table = th.closest('table');
                const tableId = table.id;

                // Determine which tab this belongs to
                let tabName = 'legal';
                if (tableId.includes('garage')) tabName = 'garage';
                else if (tableId.includes('indoor')) tabName = 'indoor';
                else if (tableId.includes('outdoor')) tabName = 'outdoor';

                const state = tabStates[tabName];

                // Toggle sort direction
                if (state.sort.column === column) {
                    state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    state.sort.column = column;
                    state.sort.direction = 'asc';
                }

                // Update visual indicators
                table.querySelectorAll('th').forEach(h => {
                    h.classList.remove('sorted-asc', 'sorted-desc');
                });
                th.classList.add(state.sort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');

                // Re-render
                renderCurrentTab();
            });
        });

        // Language change listener
        window.addEventListener('languageChanged', () => {
            renderCurrentTab();
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    async function initParkingMarkets() {
        // Load data
        const loaded = await loadParkingMarketsData();
        if (!loaded) return;

        // Setup event listeners
        setupEventListeners();

        // Apply translations
        window.applyTranslations();

        // Render initial tab (legal)
        renderCurrentTab();

        // Set initial sort indicator
        document.querySelector('#legal-table th[data-sort="country"]')?.classList.add('sorted-asc');
    }

    // Export init function for router
    window.initParkingMarkets = initParkingMarkets;

})(); // End of ParkingMarkets module
