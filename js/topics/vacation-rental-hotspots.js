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
        'beach': {
            label: { fr: 'Plage', en: 'Beach' },
            icon: '🏖️',
            tooltip: { fr: 'Destination balnéaire', en: 'Beach destination' }
        },
        'urban': {
            label: { fr: 'Urbain', en: 'Urban' },
            icon: '🏙️',
            tooltip: { fr: 'Ville/Centre urbain', en: 'City/Urban center' }
        },
        'nature': {
            label: { fr: 'Nature', en: 'Nature' },
            icon: '🏔️',
            tooltip: { fr: 'Nature/Montagne', en: 'Nature/Mountain' }
        }
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
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.countries)).then(res => res.json()),
                fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.vacationRentalHotspots)).then(res => res.json())
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
        const market = marketTypes[marketType];
        const label = market.label[window.currentLang] || market.label.fr;
        return `<span class="market-badge">${label}</span>`;
    }

    // Use tooltip module functions
    const createTooltipCell = window.TooltipModule.createTooltipCell;
    const setupSmartTooltip = window.TooltipModule.setupSmartTooltip;

    // Get licensing badge with info icon and tooltip
    function getLicensingBadge(licensing) {
        const level = licensingLevels[licensing.level];
        const label = level.label[window.currentLang] || level.label.fr;
        const details = licensing.details[window.currentLang] || licensing.details.fr;
        const legalNotes = licensing.legalNotes ? (licensing.legalNotes[window.currentLang] || licensing.legalNotes.fr) : '';

        // Combine details and legal notes for tooltip
        const tooltipContent = legalNotes ? `${details}<br><br>${legalNotes}` : details;

        return createTooltipCell({
            mainContent: `<span class="licensing-badge" style="background-color: ${level.color}">${label}</span>`,
            tooltipContent: tooltipContent,
            cellClass: 'licensing-cell',
            iconClass: 'licensing-info-icon',
            tooltipClass: 'licensing-tooltip',
            position: 'right'
        });
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

    // Format profitability with tooltip
    function formatProfitability(city) {
        const lang = window.currentLang;

        if (!city.profitability) {
            return '<span style="color: #999;">N/A</span>';
        }

        const prof = city.profitability.profitabilityBySize;

        // Calculate average profitability across sizes
        const avg50 = prof["50m2"].profitability;
        const avg100 = prof["100m2"].profitability;
        const avg200 = prof["200m2"].profitability;
        const avgProf = ((avg50 + avg100 + avg200) / 3).toFixed(1);

        // Color based on profitability
        let color = '#4CAF50';  // Green
        if (avgProf < 3) color = '#F44336';  // Red
        else if (avgProf < 5) color = '#FF9800';  // Orange

        // Build tooltip content
        const header = lang === 'fr' ? 'Rentabilité nette annuelle' : 'Annual net profitability';
        const dayLimitLabel = lang === 'fr' ? 'Limite jours/an' : 'Day limit/year';
        const occupancyLabel = lang === 'fr' ? 'Taux d\'occupation' : 'Occupancy rate';
        const revenueLabel = lang === 'fr' ? 'Revenu mensuel moyen' : 'Average monthly revenue';
        const priceLabel = lang === 'fr' ? 'Prix du bien' : 'Property price';
        const profLabel = lang === 'fr' ? 'Rentabilité' : 'Profitability';

        const tooltipContent = `
            <div class="profitability-tooltip-content">
                <strong>${header}</strong><br>
                <span class="tooltip-meta">${dayLimitLabel}: ${city.dayLimit === 365 ? '∞' : city.dayLimit} | ${occupancyLabel}: ${city.occupancyRate}%</span>
                <div class="prof-breakdown">
                    <div class="prof-row">
                        <span class="prof-size">50m²:</span>
                        <span class="prof-revenue">${prof["50m2"].monthlyRevenue}$/mo</span>
                        <span class="prof-price">($${(prof["50m2"].propertyPrice / 1000).toFixed(0)}k)</span>
                        <span class="prof-value">${prof["50m2"].profitability}%</span>
                    </div>
                    <div class="prof-row">
                        <span class="prof-size">100m²:</span>
                        <span class="prof-revenue">${prof["100m2"].monthlyRevenue}$/mo</span>
                        <span class="prof-price">($${(prof["100m2"].propertyPrice / 1000).toFixed(0)}k)</span>
                        <span class="prof-value">${prof["100m2"].profitability}%</span>
                    </div>
                    <div class="prof-row">
                        <span class="prof-size">200m²:</span>
                        <span class="prof-revenue">${prof["200m2"].monthlyRevenue}$/mo</span>
                        <span class="prof-price">($${(prof["200m2"].propertyPrice / 1000).toFixed(0)}k)</span>
                        <span class="prof-value">${prof["200m2"].profitability}%</span>
                    </div>
                </div>
            </div>
        `;

        return createTooltipCell({
            mainContent: `<span class="profitability-value" style="color: ${color}; font-weight: 700; font-size: 1.1rem;">${avgProf}%</span>`,
            tooltipContent: tooltipContent,
            cellClass: 'profitability-cell',
            iconClass: 'profitability-info-icon',
            tooltipClass: 'profitability-tooltip',
            iconFirst: true
        });
    }

    // Escape HTML for attributes
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Format taxation with tooltip
    function formatTaxation(city) {
        const lang = window.currentLang;

        const items = city.taxation.items[lang] || city.taxation.items.fr;
        const notes = city.taxation.notes ? (city.taxation.notes[lang] || city.taxation.notes.fr) : '';

        const itemsHtml = items.map(item => `<div style="font-size: 0.85em; line-height: 1.4;">${item}</div>`).join('');

        // Toujours afficher l'icône, mais avec un état visuel différent
        const hasNotes = notes && notes.trim() !== '';
        const tooltipContent = hasNotes ? notes : (window.translations?.[lang]?.vacationRentalHotspots?.tooltips?.noAdditionalInfo || 'N/A');

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

    // Format management services tooltip
    function formatManagementServices(city) {
        const lang = window.currentLang;
        const services = city.managementServices[lang] || city.managementServices.fr;

        // Pattern matching to replace prefix
        let formattedServices = services;

        if (lang === 'fr') {
            // Replace "Nombreuses: " with "Nombreux services de gestion locative :\n"
            formattedServices = formattedServices.replace(/^Nombreuses\s*:\s*/i, 'Nombreux services de gestion locative :<br>');
            formattedServices = formattedServices.replace(/^Limités\s*:\s*/i, 'Services de gestion locative limités :<br>');
        } else {
            // Replace "Numerous: " with "Numerous rental management services:\n"
            formattedServices = formattedServices.replace(/^Numerous\s*:\s*/i, 'Numerous rental management services:<br>');
            formattedServices = formattedServices.replace(/^Limited\s*:\s*/i, 'Limited rental management services:<br>');
        }

        // Replace commas with line breaks for each service on its own line
        formattedServices = formattedServices.replace(/,\s*/g, '<br>');

        return `<div class="services-tooltip-content">${formattedServices}</div>`;
    }

    // Render table
    function renderTable(data) {
        tableBody.innerHTML = '';

        if (data.length === 0) {
            noResults.classList.remove('hidden');
            resultCount.textContent = '0';
            return;
        }

        noResults.classList.add('hidden');
        resultCount.textContent = data.length;

        data.forEach(city => {
            const row = document.createElement('tr');

            const cityName = city.city[window.currentLang] || city.city.fr;
            const countryName = city.countryName[window.currentLang] || city.countryName.fr;

            // Airport information
            const airportName = city.airport ? (city.airport.name[window.currentLang] || city.airport.name.fr) : '';
            const airportDistance = city.airport ? (city.airport.distance[window.currentLang] || city.airport.distance.fr) : '';
            const alternativeTransport = city.alternativeTransport ? (city.alternativeTransport[window.currentLang] || city.alternativeTransport.fr) : '';

            // Prepare tooltip data
            const platformsList = city.platforms.join(', ');
            const platformStats = city.platformStats ? (city.platformStats[window.currentLang] || city.platformStats.fr) : '';
            let platformTooltip = platformsList;
            if (platformStats) {
                platformTooltip = `${platformsList}<br><span style="font-size: 0.85em; color: #999; margin-top: 4px; display: block;">${platformStats}</span>`;
            }
            const servicesFormatted = formatManagementServices(city);

            // Get market type info
            const marketType = marketTypes[city.marketType];
            const marketIcon = marketType.icon;
            const marketTooltip = marketType.tooltip[window.currentLang] || marketType.tooltip.fr;

            // Add market quality if available
            let tooltipHtml = marketTooltip;
            if (city.marketQuality) {
                const marketQuality = city.marketQuality[window.currentLang] || city.marketQuality.fr;
                tooltipHtml = `${marketTooltip}<br><span style="font-size: 0.85em; color: #999; font-style: italic;">${marketQuality}</span>`;
            }

            row.innerHTML = `
                <td class="info-cell">
                    <div class="info-icons">
                        <span class="info-icon platform-icon">
                            🌐
                            <span class="custom-tooltip">${platformTooltip}</span>
                        </span>
                        <span class="info-icon services-icon">
                            🏢
                            <span class="custom-tooltip services-tooltip">${servicesFormatted}</span>
                        </span>
                    </div>
                </td>
                <td class="destination-cell">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div>
                            <strong>${cityName}</strong>
                            <span class="info-icon type-icon">
                                ${marketIcon}
                                <span class="custom-tooltip">${tooltipHtml}</span>
                            </span>
                        </div>
                        ${airportName ? `<div style="font-size: 0.7em; color: #888; line-height: 1.2;">${airportName} (${airportDistance})</div>` : ''}
                        ${alternativeTransport ? `<div style="font-size: 0.7em; color: #888; line-height: 1.2;">🚢 ${alternativeTransport}</div>` : ''}
                    </div>
                </td>
                <td class="country-cell">
                    <span class="flag">${city.flag}</span>
                    <span class="country-name">${countryName}</span>
                </td>
                <td class="licensing-td">${getLicensingBadge(city.licensing)}</td>
                <td class="taxation-td">${formatTaxation(city)}</td>
                <td class="center profitability-td">${formatProfitability(city)}</td>
            `;

            // Add click event listeners for all tooltips
            const typeIcon = row.querySelector('.type-icon');
            const platformIcon = row.querySelector('.platform-icon');
            const servicesIcon = row.querySelector('.services-icon');

            // Regular tooltips (type, platform, services)
            [typeIcon, platformIcon, servicesIcon].forEach(icon => {
                if (icon) {
                    icon.addEventListener('click', function(e) {
                        e.stopPropagation();
                        // Close all other tooltips
                        document.querySelectorAll('.info-icon.active').forEach(otherIcon => {
                            if (otherIcon !== this) otherIcon.classList.remove('active');
                        });
                        // Toggle this tooltip
                        this.classList.toggle('active');
                    });

                    // Close tooltip when mouse leaves the icon
                    icon.addEventListener('mouseleave', function(e) {
                        this.classList.remove('active');
                    });
                }
            });

            // Initialize tooltips using the unified module
            window.TooltipModule.initializeTooltips(row);

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
    
            // Revenue filter (based on profitability)
            let matchesRevenue = true;
            if (selectedRevenue !== 'all' && city.profitability && city.profitability.profitabilityBySize) {
                const prof = city.profitability.profitabilityBySize;
                const avgRevenue = (prof["50m2"].monthlyRevenue + prof["100m2"].monthlyRevenue + prof["200m2"].monthlyRevenue) / 3;
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
                case 'profitability':
                    // Calculate average profitability for sorting
                    if (a.profitability && a.profitability.profitabilityBySize) {
                        const aProf = a.profitability.profitabilityBySize;
                        aVal = (aProf["50m2"].profitability + aProf["100m2"].profitability + aProf["200m2"].profitability) / 3;
                    } else {
                        aVal = 0;
                    }
                    if (b.profitability && b.profitability.profitabilityBySize) {
                        const bProf = b.profitability.profitabilityBySize;
                        bVal = (bProf["50m2"].profitability + bProf["100m2"].profitability + bProf["200m2"].profitability) / 3;
                    } else {
                        bVal = 0;
                    }
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
    
        const workableCities = cityData.filter(c => c.profitability && c.profitability.profitabilityBySize);
        const avgRevenue = workableCities.length > 0
            ? Math.round(workableCities.reduce((sum, c) => {
                const prof = c.profitability.profitabilityBySize;
                return sum + (prof["50m2"].monthlyRevenue + prof["100m2"].monthlyRevenue + prof["200m2"].monthlyRevenue) / 3;
            }, 0) / workableCities.length)
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

        // Close tooltips when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.info-icon.active').forEach(icon => {
                icon.classList.remove('active');
            });
        });

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

        // Listen for language changes and re-render table
        window.addEventListener('languageChanged', () => {
            filterAndSort();
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

        // Initialize unlock button in result-count area
        if (window.TooltipModule) {
            window.TooltipModule.initUnlockButton();
        }

        // Set initial sort indicator
        const sortHeader = document.querySelector('th[data-sort="city"]');
        if (sortHeader) {
            sortHeader.classList.add('sorted-asc');
        }
    }

    // Export init function for router
    window.initVacationRentalHotspots = initVacationRentalHotspots;

})(); // End of VacationRentalHotspots module
