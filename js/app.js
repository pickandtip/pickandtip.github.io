// ==========================================
// GLOBAL STATE
// ==========================================
let currentLang = 'fr';
let translations = {};
let countries = [];
let propertyTaxes = [];
let taxData = []; // Merged data from countries + propertyTaxes
let currentSort = { column: 'country', direction: 'asc' };
let currentFilter = 'all';

// DOM Elements (will be initialized after DOMContentLoaded)
let tableBody, searchInput, regionFilter, filterBtns, resultCount, noResults;

// ==========================================
// DATA LOADING
// ==========================================
async function loadData() {
    try {
        // Load all data in parallel
        const [countriesData, propertyTaxesData, frTranslations, enTranslations] = await Promise.all([
            fetch('data/countries/countries.json').then(res => res.json()),
            fetch('data/topics/property-taxes.json').then(res => res.json()),
            fetch('data/i18n/fr.json').then(res => res.json()),
            fetch('data/i18n/en.json').then(res => res.json())
        ]);

        countries = countriesData;
        propertyTaxes = propertyTaxesData;
        translations = {
            fr: frTranslations,
            en: enTranslations
        };

        // Merge countries with property taxes
        taxData = propertyTaxes.map(tax => {
            const country = countries.find(c => c.code === tax.countryCode);
            if (!country) {
                console.warn(`Country not found for code: ${tax.countryCode}`);
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
        console.error('Error loading data:', error);
        alert('Failed to load application data. Please refresh the page.');
        return false;
    }
}

// ==========================================
// LANGUAGE MANAGEMENT
// ==========================================
function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const savedLang = localStorage.getItem('pickandtip-lang');

    if (savedLang) {
        return savedLang;
    }

    if (browserLang.startsWith('en')) {
        return 'en';
    }

    return 'fr';
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('pickandtip-lang', lang);
    document.documentElement.lang = lang;

    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const translation = getNestedTranslation(translations[lang], key);
        if (translation) {
            el.textContent = translation;
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const translation = getNestedTranslation(translations[lang], key);
        if (translation) {
            el.placeholder = translation;
        }
    });

    // Update select options
    const regionFilterEl = document.getElementById('regionFilter');
    if (regionFilterEl) {
        const options = regionFilterEl.querySelectorAll('option');
        options.forEach(option => {
            const key = option.dataset.i18n;
            if (key) {
                const translation = getNestedTranslation(translations[lang], key);
                if (translation) {
                    option.textContent = translation;
                }
            }
        });
    }

    // Re-render table with new language
    filterAndSort();
}

function getNestedTranslation(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// ==========================================
// TABLE MANAGEMENT
// ==========================================
function renderTable(data) {
    tableBody.innerHTML = '';

    if (data.length === 0) {
        noResults.style.display = 'block';
        resultCount.textContent = '0';
        return;
    }

    noResults.style.display = 'none';
    resultCount.textContent = data.length;

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.animationDelay = `${index * 0.02}s`;

        const taxClass = item.propertyTaxValue === 0 ? 'tax-none' :
                         item.propertyTaxValue < 0.5 ? 'tax-low' :
                         item.propertyTaxValue < 1.5 ? 'tax-medium' : 'tax-high';

        const transferClass = item.transferTaxValue === 0 ? 'tax-none' :
                              item.transferTaxValue < 2 ? 'tax-low' :
                              item.transferTaxValue < 5 ? 'tax-medium' : 'tax-high';

        const regionClass = item.region.toLowerCase().replace('-', '');
        const regionName = translations[currentLang].regions[item.region] || item.region;
        const countryName = item.country[currentLang];
        const notes = item.notes[currentLang];

        row.innerHTML = `
            <td>
                <div class="country-cell">
                    <span class="flag">${item.flag}</span>
                    <span>${countryName}</span>
                </div>
            </td>
            <td><span class="region-badge region-${regionClass}">${regionName}</span></td>
            <td><span class="tax-value ${taxClass}">${item.propertyTax}</span></td>
            <td><span class="tax-value ${transferClass}">${item.transferTax}</span></td>
            <td><span class="notes">${notes}</span></td>
        `;

        tableBody.appendChild(row);
    });
}

function filterAndSort() {
    let filtered = [...taxData];

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.country[currentLang].toLowerCase().includes(searchTerm) ||
            item.country.fr.toLowerCase().includes(searchTerm) ||
            item.country.en.toLowerCase().includes(searchTerm) ||
            translations[currentLang].regions[item.region]?.toLowerCase().includes(searchTerm) ||
            item.notes[currentLang].toLowerCase().includes(searchTerm)
        );
    }

    const region = regionFilter.value;
    if (region) {
        filtered = filtered.filter(item => item.region === region);
    }

    if (currentFilter === 'no-tax') {
        filtered = filtered.filter(item => item.propertyTaxValue === 0);
    } else if (currentFilter === 'low-tax') {
        filtered = filtered.filter(item => item.propertyTaxValue > 0 && item.propertyTaxValue < 0.5);
    }

    filtered.sort((a, b) => {
        let valA, valB;

        switch(currentSort.column) {
            case 'country':
                valA = a.country[currentLang];
                valB = b.country[currentLang];
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
            default:
                valA = a.country[currentLang];
                valB = b.country[currentLang];
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

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterAndSort();
        });
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

    // Language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });
}

// ==========================================
// STATISTICS UPDATE
// ==========================================
function updateStats() {
    document.getElementById('countryCount').textContent = taxData.length;
    document.getElementById('noTaxCount').textContent = taxData.filter(d => d.propertyTaxValue === 0).length;
    document.getElementById('lowTaxCount').textContent = taxData.filter(d => d.propertyTaxValue > 0 && d.propertyTaxValue < 0.5).length;
}

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
    // Initialize DOM elements
    tableBody = document.getElementById('tableBody');
    searchInput = document.getElementById('searchInput');
    regionFilter = document.getElementById('regionFilter');
    filterBtns = document.querySelectorAll('.filter-btn');
    resultCount = document.getElementById('resultCount');
    noResults = document.getElementById('noResults');

    // Load data
    const loaded = await loadData();
    if (!loaded) return;

    // Setup event listeners
    setupEventListeners();

    // Update statistics
    updateStats();

    // Detect and set language
    const detectedLang = detectLanguage();
    setLanguage(detectedLang);

    // Set initial sort indicator
    document.querySelector('th[data-sort="country"]').classList.add('sorted-asc');
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
