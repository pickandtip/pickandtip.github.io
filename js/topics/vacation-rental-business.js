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
                fetch('data/countries/countries.json').then(res => res.json()),
                fetch('data/topics/vacation-rental-business.json').then(res => res.json())
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

    // Get legal framework badge
    function getLegalBadge(legalFramework) {
        const level = legalLevels[legalFramework.level] || legalLevels['moderate'];
        const label = level.label[window.currentLang] || level.label.fr;
        const details = legalFramework.details[window.currentLang] || legalFramework.details.fr;

        return `<span class="legal-badge" style="background-color: ${level.color}" title="${details}">${label}</span>`;
    }

    // Get services badge
    function getServicesBadge(services) {
        const level = servicesLevels[services.level] || servicesLevels['limited'];
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
            return `<span class="platform-item" title="${platform.name}">${scope} ${platform.name} ${langs}</span>`;
        }).join(' ');

        return `<div class="platforms-list">${badges}</div>`;
    }

    // Truncate text with ellipsis
    function truncateText(text, maxLength = 150) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + '...';
    }

    // Render table
    function renderTableBusiness(data) {
        tableBody.innerHTML = '';
    
        if (data.length === 0) {
            noResults.style.display = 'block';
            resultCount.textContent = '0';
            return;
        }
    
        noResults.style.display = 'none';
        resultCount.textContent = data.length;
    
        data.forEach(country => {
            const row = document.createElement('tr');

            const countryName = country.countryName[window.currentLang] || country.countryName.fr;
            const notes = country.notes[window.currentLang] || country.notes.fr;
            const taxation = country.taxation[window.currentLang] || country.taxation.fr;
            const regionLabel = window.translations?.regions?.[country.region] || country.region;
            const truncatedNotes = truncateText(notes, 150);

            row.innerHTML = `
                <td><span class="flag">${country.flag}</span> ${countryName}</td>
                <td>${regionLabel}</td>
                <td>${getLegalBadge(country.legalFramework)}</td>
                <td class="small-text taxation-cell">${taxation}</td>
                <td class="platforms-cell">${getPlatformsDisplay(country.platforms)}</td>
                <td>${getServicesBadge(country.managementServices)}</td>
                <td class="notes-cell">${truncatedNotes}</td>
            `;

            // Add tooltip to notes cell if text was truncated
            if (notes.length > 150) {
                const notesCell = row.querySelector('.notes-cell');
                if (notesCell) {
                    notesCell.setAttribute('title', notes);
                }
            }

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
    
        // Set initial sort indicator
        const sortHeader = document.querySelector('th[data-sort="country"]');
        if (sortHeader) {
            sortHeader.classList.add('sorted-asc');
        }
    }
    
    // Export init function for router
    window.initVacationRentalBusiness = initVacationRentalBusiness;

})(); // End of VacationRentalBusiness module
