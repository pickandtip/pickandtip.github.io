// ==========================================
// EATING FOR LESS THAN 4€/DAY - NUTRITION GUIDE
// ==========================================

(function() {
    'use strict';

    let data = null;
    let currentLang = 'fr';

    /**
     * Initialize the eating guide page
     */
    async function initEatingForLessThanFiveBucksADay() {
        try {
            console.log('🍽️ Initializing Eating for Less Than Five Bucks a Day...');

            // Detect current language
            currentLang = window.currentLang || document.documentElement.lang || 'fr';
            console.log('Current language:', currentLang);

            // Check if translations are loaded
            console.log('Translations loaded:', window.translations ? 'Yes' : 'No');
            if (window.translations && window.translations[currentLang]) {
                console.log('Has eatingForLessThanFiveBucksADay translations:',
                    'eatingForLessThanFiveBucksADay' in window.translations[currentLang]);
            }

            // Load data
            const response = await fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.eatingForLessThanFiveBucksADay));
            data = await response.json();
            console.log('Data loaded successfully');

            // Setup tab navigation
            setupTabNavigation();

            // Initialize all tabs
            initWeeklyPlanTab();
            initShoppingListTab();
            initNutritionTab();

            console.log('✅ Eating guide initialized');

        } catch (error) {
            console.error('❌ Error loading eating guide data:', error);
            alert('Erreur lors du chargement des données nutrition. Veuillez rafraîchir la page.');
        }
    }

    /**
     * Setup tab navigation
     */
    function setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                document.getElementById(`tab-${targetTab}`).classList.add('active');
            });
        });
    }

    /**
     * Initialize Weekly Plan Tab
     */
    function initWeeklyPlanTab() {
        if (!data || !data.weeklyPlan) return;

        const tbody = document.getElementById('daily-meals-tbody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Clear existing rows

        const meals = data.weeklyPlan.dailyMeals;

        meals.forEach((meal, index) => {
            const row = createMealRow(meal, index);
            tbody.appendChild(row);
        });
    }

    /**
     * Create a table row for a single day
     */
    function createMealRow(meal, index) {
        const row = document.createElement('tr');

        const dayLabel = currentLang === 'fr' ? meal.day : meal.dayEn;
        const mealName = meal.meal[currentLang];
        const budgetStatus = meal.withinBudget ? '✓' : '⚠️';
        const budgetClass = meal.withinBudget ? 'within-budget' : 'over-budget';

        // Create ingredients summary (collapsed by default, expandable)
        const ingredientsList = meal.ingredients.map(ing =>
            `${ing.name} (${ing.quantity})`
        ).join(', ');

        row.innerHTML = `
            <td><strong>${capitalizeFirst(dayLabel)}</strong></td>
            <td>
                <div class="meal-name">${mealName}</div>
                <div class="meal-ingredients-summary" title="${ingredientsList}">
                    <small>${meal.ingredients.length} ingrédients</small>
                </div>
            </td>
            <td class="centered"><strong>${meal.nutrition.protein}g</strong></td>
            <td class="centered">${meal.nutrition.calories}</td>
            <td class="centered">${meal.nutrition.fat}g</td>
            <td class="centered">${meal.nutrition.carbs}g</td>
            <td class="centered">
                <span class="cost-badge ${budgetClass}">${budgetStatus} ${meal.cost.toFixed(2)}€</span>
            </td>
        `;

        // Make row clickable to expand ingredients
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => {
            alert(`${capitalizeFirst(dayLabel)} - ${mealName}\n\nIngrédients:\n${ingredientsList}`);
        });

        return row;
    }

    /**
     * Initialize Shopping List Tab
     */
    function initShoppingListTab() {
        if (!data || !data.shoppingList) return;

        const tableBody = document.getElementById('shopping-table-body');
        const searchInput = document.getElementById('shopping-search');
        const categoryFilter = document.getElementById('category-filter');
        const resultCount = document.getElementById('shopping-result-count');

        let items = data.shoppingList.items;

        function renderShoppingTable(filteredItems = items) {
            tableBody.innerHTML = '';

            if (filteredItems.length === 0) {
                document.getElementById('shopping-no-results').classList.remove('hidden');
                resultCount.textContent = '0';
                return;
            }

            document.getElementById('shopping-no-results').classList.add('hidden');
            resultCount.textContent = filteredItems.length;

            filteredItems.forEach(item => {
                const row = document.createElement('tr');

                const itemName = currentLang === 'en' ? item.nameEn : item.name;

                // Create suppliers links
                const suppliersHTML = item.suppliers && item.suppliers.length > 0
                    ? item.suppliers.map(supplier => `
                        <a href="${supplier.url}" target="_blank" rel="noopener noreferrer" class="supplier-link">
                            ${supplier.name}
                        </a>
                    `).join(', ')
                    : '—';

                row.innerHTML = `
                    <td><strong>${itemName}</strong></td>
                    <td><span class="category-badge">${translateCategory(item.category)}</span></td>
                    <td>${item.weeklyQuantity}</td>
                    <td>${item.unitPrice}</td>
                    <td><strong>${item.totalCost.toFixed(2)}€</strong></td>
                    <td class="suppliers-cell">${suppliersHTML}</td>
                `;

                tableBody.appendChild(row);
            });
        }

        function filterShoppingList() {
            const searchTerm = searchInput.value.toLowerCase();
            const category = categoryFilter.value;

            const filtered = items.filter(item => {
                const matchesSearch = !searchTerm ||
                    item.name.toLowerCase().includes(searchTerm) ||
                    item.nameEn.toLowerCase().includes(searchTerm);

                const matchesCategory = category === 'all' || item.category === category;

                return matchesSearch && matchesCategory;
            });

            renderShoppingTable(filtered);
        }

        // Event listeners
        searchInput.addEventListener('input', filterShoppingList);
        categoryFilter.addEventListener('change', filterShoppingList);

        // Initial render
        renderShoppingTable();
    }

    /**
     * Initialize Nutrition Tab
     */
    function initNutritionTab() {
        if (!data) return;

        // Populate lipid synergy list
        const lipidSynergyList = document.getElementById('lipid-synergy-list');
        if (lipidSynergyList && data.nutritionalBenefits && data.nutritionalBenefits.lipidSynergy) {
            const items = data.nutritionalBenefits.lipidSynergy[currentLang];
            lipidSynergyList.innerHTML = items.map(item => `<li>${item}</li>`).join('');
        }

        // Populate key principles list
        const principlesList = document.getElementById('key-principles-list');
        if (principlesList && data.keyPrinciples) {
            const items = data.keyPrinciples[currentLang];
            principlesList.innerHTML = items.map(item => `<li>${item}</li>`).join('');
        }

        // Populate tips list
        const tipsList = document.getElementById('tips-list');
        if (tipsList && data.tips) {
            const items = data.tips[currentLang];
            tipsList.innerHTML = items.map(item => `<li>${item}</li>`).join('');
        }
    }


    /**
     * Translate category names
     */
    function translateCategory(category) {
        const translations = {
            'legumes': currentLang === 'fr' ? 'Légumineuses' : 'Legumes',
            'protein': currentLang === 'fr' ? 'Protéines' : 'Protein',
            'nuts': currentLang === 'fr' ? 'Noix' : 'Nuts',
            'seeds': currentLang === 'fr' ? 'Graines' : 'Seeds',
            'fish': currentLang === 'fr' ? 'Poissons' : 'Fish',
            'vegetables': currentLang === 'fr' ? 'Légumes' : 'Vegetables',
            'aromatics': currentLang === 'fr' ? 'Aromatiques' : 'Aromatics',
            'oil': currentLang === 'fr' ? 'Huile' : 'Oil',
            'grains': currentLang === 'fr' ? 'Céréales' : 'Grains'
        };
        return translations[category] || category;
    }

    /**
     * Capitalize first letter
     */
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Update content when language changes
     */
    window.addEventListener('languageChanged', (e) => {
        currentLang = e.detail.lang;
        // Re-render all tabs with new language
        if (data) {
            initWeeklyPlanTab();
            initShoppingListTab();
            initNutritionTab();
        }
    });

    // Export init function for router
    // Function name matches the camelized route: eating-for-less-than-five-bucks-a-day
    window.initEatingForLessThanFiveBucksADay = initEatingForLessThanFiveBucksADay;

})();
