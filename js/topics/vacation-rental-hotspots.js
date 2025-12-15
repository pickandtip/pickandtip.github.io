(function() {
    'use strict';

    // Topic-specific state for Vacation Rental Hotspots (encapsulated in module scope)
    let countries = [];
    let hotspotsData = [];
    let cityData = [];
    let currentSort = { column: 'city', direction: 'asc' };
    let currentRegionFilter = 'all';
    let currentMarketFilter = 'all';
    let currentRevenueFilter = 'all';

    // DOM Elements
    let tableBody, searchInput, regionFilter, marketFilter, revenueFilter, resultCount, noResults;

    // Market type mapping
    const marketTypes = {
        'beach': { label: { fr: '🏖️ Plage', en: '🏖️ Beach' }, icon: '🏖️' },
        'urban': { label: { fr: '🏙️ Urbain', en: '🏙️ Urban' }, icon: '🏙️' },
        'nature': { label: { fr: '🏔️ Nature', en: '🏔️ Nature' }, icon: '🏔️' }
    };

    // Licensing level mapping
    const licensingLevels = {
        'minimal': { value: 0, label: { fr: 'Minimale', en: 'Minimal' }, color: '#4CAF50' },
        'registration': { value: 1, label: { fr: 'Enregistrement', en: 'Registration' }, color: '#2196F3' },
        'license': { value: 2, label: { fr: 'Licence', en: 'License' }, color: '#FF9800' },
        'gray': { value: 3, label: { fr: 'Zone grise', en: 'Gray zone' }, color: '#9E9E9E' }
    };

    // Load data
    async function loadVacationRentalHotspotsData() {
        try {
            const [countriesData, hotspotsJsonData] = await Promise.all([
                fetch('data/countries/countries.json').then(res => res.json()),
                fetch('data/topics/vacation-rental-hotspots.json').then(res => res.json())
            ]);

            countries = countriesData;
            hotspotsData = hotspotsJsonData.cities || hotspotsJsonData;

            // Merge with country data
            cityData = hotspotsData.map(city => {
                const country = countries.find(c => c.code === city.countryCode);
                if (!country) {
                    console.warn(`Country not found for code: ${city.countryCode}`);
                    return null;
                }
                return {
                    ...city,
                    countryName: country.name,
                    flag: country.flag,
                    regionName: country.region
                };
            }).filter(item => item !== null);

            return true;
        } catch (error) {
            console.error('Error loading vacation rental hotspots data:', error);
            alert('Failed to load data. Please refresh the page.');
            return false;
        }
    }
    
    // Get market type badge
    function getMarketBadge(marketType) {
        const market = marketTypes[marketType] || marketTypes['urban'];
        const label = market.label[window.currentLang] || market.label.fr;
        return `<span class="market-badge">${label}</span>`;
    }
    
    // Get licensing badge
    function getLicensingBadge(licensing) {
        const level = licensingLevels[licensing.level] || licensingLevels['registration'];
        const label = level.label[window.currentLang] || level.label.fr;
        const details = licensing.details[window.currentLang] || licensing.details.fr;
    
        return `<span class="licensing-badge" style="background-color: ${level.color}" title="${details}">${label}</span>`;
    }
    
    // Format day limit
    function formatDayLimit(dayLimit) {
        if (dayLimit === 365) {
            return '<span style="color: #4CAF50; font-weight: 600;">∞</span>';
        } else if (dayLimit === 0) {
            return '<span style="color: #F44336; font-weight: 600;">0</span>';
        } else if (dayLimit <= 90) {
            return `<span style="color: #FF9800; font-weight: 600;">${dayLimit}</span>`;
        } else {
            return `<span style="color: #2196F3; font-weight: 600;">${dayLimit}</span>`;
        }
    }
    
    // Format revenue range
    function formatRevenue(revenue) {
        if (revenue.min === 0 && revenue.max === 0) {
            return '<span style="color: #999;">N/A</span>';
        }
    
        const min = revenue.min.toLocaleString();
        const max = revenue.max.toLocaleString();
        const currency = revenue.currency || 'USD';
    
        let color = '#4CAF50';
        const avg = (revenue.min + revenue.max) / 2;
        if (avg < 1000) color = '#FF9800';
        else if (avg >= 2000) color = '#2196F3';
    
        return `<span style="color: ${color}; font-weight: 600;">${min}-${max} ${currency}</span>`;
    }
    
    // Format occupancy
    function formatOccupancy(rate) {
        if (rate === 0) {
            return '<span style="color: #999;">N/A</span>';
        }
    
        let color = '#4CAF50';
        if (rate < 50) color = '#F44336';
        else if (rate < 65) color = '#FF9800';
    
        return `<span style="color: ${color}; font-weight: 600;">${rate}%</span>`;
    }
    
    // Render table
    function renderTable(data) {
        tableBody.innerHTML = '';
    
        if (data.length === 0) {
            noResults.style.display = 'block';
            resultCount.textContent = '0';
            return;
        }
    
        noResults.style.display = 'none';
        resultCount.textContent = data.length;
    
        data.forEach(city => {
            const row = document.createElement('tr');
    
            const cityName = city.city[window.currentLang] || city.city.fr;
            const countryName = city.countryName[window.currentLang] || city.countryName.fr;
            const notes = city.notes[window.currentLang] || city.notes.fr;
            const taxation = city.totalTaxation[window.currentLang] || city.totalTaxation.fr;
            const services = city.managementServices[window.currentLang] || city.managementServices.fr;
    
            row.innerHTML = `
                <td><strong>${cityName}</strong></td>
                <td><span class="flag">${city.flag}</span> ${countryName}</td>
                <td>${getMarketBadge(city.marketType)}</td>
                <td class="center">${formatDayLimit(city.dayLimit)}</td>
                <td class="right">${formatRevenue(city.monthlyRevenue)}</td>
                <td class="center">${formatOccupancy(city.occupancyRate)}</td>
                <td>${getLicensingBadge(city.licensing)}</td>
                <td class="small-text">${taxation}</td>
                <td class="small-text">${city.platforms.join(', ')}</td>
                <td class="small-text">${services}</td>
                <td class="notes-cell">${notes}</td>
            `;
    
            tableBody.appendChild(row);
        });
    }
    
    // Filter and sort
    function filterAndSort() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedRegion = regionFilter.value;
        const selectedMarket = marketFilter.value;
        const selectedRevenue = revenueFilter.value;
    
        let filtered = cityData.filter(city => {
            // Search filter
            const cityName = (city.city.fr || '').toLowerCase() + ' ' + (city.city.en || '').toLowerCase();
            const countryName = (city.countryName.fr || '').toLowerCase() + ' ' + (city.countryName.en || '').toLowerCase();
            const matchesSearch = cityName.includes(searchTerm) || countryName.includes(searchTerm);
    
            // Region filter
            const matchesRegion = selectedRegion === 'all' || city.regionName === selectedRegion;
    
            // Market filter
            const matchesMarket = selectedMarket === 'all' || city.marketType === selectedMarket;
    
            // Revenue filter
            let matchesRevenue = true;
            if (selectedRevenue !== 'all') {
                const avgRevenue = (city.monthlyRevenue.min + city.monthlyRevenue.max) / 2;
                if (selectedRevenue === 'high') matchesRevenue = avgRevenue > 2000;
                else if (selectedRevenue === 'medium') matchesRevenue = avgRevenue >= 1000 && avgRevenue <= 2000;
                else if (selectedRevenue === 'low') matchesRevenue = avgRevenue < 1000;
            }
    
            return matchesSearch && matchesRegion && matchesMarket && matchesRevenue;
        });
    
        // Sort
        filtered.sort((a, b) => {
            let aVal, bVal;
    
            switch (currentSort.column) {
                case 'city':
                    aVal = a.city[window.currentLang] || a.city.fr;
                    bVal = b.city[window.currentLang] || b.city.fr;
                    break;
                case 'country':
                    aVal = a.countryName[window.currentLang] || a.countryName.fr;
                    bVal = b.countryName[window.currentLang] || b.countryName.fr;
                    break;
                case 'marketType':
                    aVal = a.marketType;
                    bVal = b.marketType;
                    break;
                case 'dayLimit':
                    aVal = a.dayLimit;
                    bVal = b.dayLimit;
                    break;
                case 'revenue':
                    aVal = (a.monthlyRevenue.min + a.monthlyRevenue.max) / 2;
                    bVal = (b.monthlyRevenue.min + b.monthlyRevenue.max) / 2;
                    break;
                case 'occupancy':
                    aVal = a.occupancyRate;
                    bVal = b.occupancyRate;
                    break;
                case 'licensing':
                    aVal = a.licensing.value || 0;
                    bVal = b.licensing.value || 0;
                    break;
                default:
                    aVal = a.city[window.currentLang] || a.city.fr;
                    bVal = b.city[window.currentLang] || b.city.fr;
            }
    
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
    
            if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    
        renderTable(filtered);
    }
    
    // Update statistics
    function updateStats() {
        const totalCities = cityData.length;
        const unlimited = cityData.filter(c => c.dayLimit === 365).length;
    
        const workableCities = cityData.filter(c => c.monthlyRevenue.min > 0);
        const avgRevenue = workableCities.length > 0
            ? Math.round(workableCities.reduce((sum, c) => (sum + (c.monthlyRevenue.min + c.monthlyRevenue.max) / 2), 0) / workableCities.length)
            : 0;
    
        const avgOccupancy = cityData.length > 0
            ? Math.round(cityData.reduce((sum, c) => sum + c.occupancyRate, 0) / cityData.length)
            : 0;
    
        document.getElementById('total-cities').textContent = totalCities;
        document.getElementById('unlimited-count').textContent = unlimited;
        document.getElementById('avg-revenue').textContent = avgRevenue.toLocaleString() + '$';
        document.getElementById('avg-occupancy').textContent = avgOccupancy + '%';
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', filterAndSort);
    
        // Filter dropdowns
        regionFilter.addEventListener('change', () => {
            currentRegionFilter = regionFilter.value;
            filterAndSort();
        });
    
        marketFilter.addEventListener('change', () => {
            currentMarketFilter = marketFilter.value;
            filterAndSort();
        });
    
        revenueFilter.addEventListener('change', () => {
            currentRevenueFilter = revenueFilter.value;
            filterAndSort();
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
    
                filterAndSort();
            });
        });
    }
    
    // Initialize
    async function initVacationRentalHotspots() {
        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 50));
    
        // Initialize DOM elements
        tableBody = document.getElementById('tableBody');
        searchInput = document.getElementById('searchInput');
        regionFilter = document.getElementById('regionFilter');
        marketFilter = document.getElementById('marketFilter');
        revenueFilter = document.getElementById('revenueFilter');
        resultCount = document.getElementById('result-count');
        noResults = document.getElementById('no-results');
    
        // Check if DOM elements exist
        if (!tableBody || !searchInput || !regionFilter || !marketFilter || !revenueFilter || !resultCount || !noResults) {
            console.error('Vacation Rental Hotspots: DOM elements not found, retrying...');
            await new Promise(resolve => setTimeout(resolve, 100));
            return initVacationRentalHotspots();
        }
    
        const loaded = await loadVacationRentalHotspotsData();
        if (!loaded) return;
    
        setupEventListeners();
        updateStats();
    
        // Apply translations
        if (window.applyTranslations) {
            window.applyTranslations();
        }
    
        // Initial render
        filterAndSort();
    
        // Set initial sort indicator
        const sortHeader = document.querySelector('th[data-sort="city"]');
        if (sortHeader) {
            sortHeader.classList.add('sorted-asc');
        }
    }
    
    // Export init function for router
    window.initVacationRentalHotspots = initVacationRentalHotspots;

})(); // End of VacationRentalHotspots module
