/**
 * Module de formulaire de contact pour Pick & Tip
 * Permet aux visiteurs de demander à être recontactés pour investissement immobilier
 */

class ContactFormModule {
  constructor() {
    this.isSubmitting = false;
    this.autocompleteTimeout = null;
    this.selectedCountry = null;
    this.selectedRegion = 'all'; // Default: all regions
    this.currentStep = 1; // Wizard step (1, 2, 3, or 4)
    this.totalSteps = 4;
  }

  /**
   * Crée et retourne le HTML du formulaire
   */
  getHTML() {
    return `
      <div class="contact-section" id="contact-section">
        <div class="contact-toggle" id="contact-toggle">
          <div class="contact-toggle-content">
            <div class="contact-toggle-icon">💼</div>
            <div class="contact-toggle-text">
              <h3>{{ contactForm.title }} <span class="click-here-inline">{{ contactForm.subtitle }}</span></h3>
            </div>
          </div>
          <div class="contact-toggle-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <div class="contact-form-wrapper" id="contact-form-wrapper" style="display: none;">
          <!-- Step indicator -->
          <div class="wizard-steps">
            <div class="wizard-step active" data-step="1">
              <div class="step-number">1</div>
              <div class="step-label">{{ contactForm.wizard.step1 }}</div>
            </div>
            <div class="wizard-step" data-step="2">
              <div class="step-number">2</div>
              <div class="step-label">{{ contactForm.wizard.step2 }}</div>
            </div>
            <div class="wizard-step" data-step="3">
              <div class="step-number">3</div>
              <div class="step-label">{{ contactForm.wizard.step3 }}</div>
            </div>
            <div class="wizard-step" data-step="4">
              <div class="step-number">4</div>
              <div class="step-label">{{ contactForm.wizard.step4 }}</div>
            </div>
          </div>

          <form id="contact-form" class="contact-form" novalidate>

            <!-- STEP 1: Country Selection -->
            <div class="wizard-step-content" id="step-1" style="display: block;">
              <div class="form-group">
                <label for="contact-target-country">
                  {{ contactForm.fields.targetCountry.label }}
                </label>

                <!-- Region selector -->
                <div class="region-selector-wrapper">
                  <label class="region-selector-label">{{ contactForm.fields.targetCountry.regionLabel }}</label>
                  <div class="region-selector" id="region-selector">
                    <button type="button" class="region-btn" data-region="all">
                      <span class="region-icon">🌍</span>
                      <span class="region-name">{{ filter.allRegions }}</span>
                    </button>
                    <button type="button" class="region-btn" data-region="europe">
                      <span class="region-icon">🇪🇺</span>
                      <span class="region-name">{{ regions.europe }}</span>
                    </button>
                    <button type="button" class="region-btn" data-region="america">
                      <span class="region-icon">🌎</span>
                      <span class="region-name">{{ regions.america }}</span>
                    </button>
                    <button type="button" class="region-btn" data-region="asia">
                      <span class="region-icon">🌏</span>
                      <span class="region-name">{{ regions.asia }}</span>
                    </button>
                    <button type="button" class="region-btn" data-region="middleEast">
                      <span class="region-icon">🕌</span>
                      <span class="region-name">{{ regions.middleEast }}</span>
                    </button>
                    <button type="button" class="region-btn" data-region="africa">
                      <span class="region-icon">🦁</span>
                      <span class="region-name">{{ regions.africa }}</span>
                    </button>
                    <button type="button" class="region-btn" data-region="oceania">
                      <span class="region-icon">🏝️</span>
                      <span class="region-name">{{ regions.oceania }}</span>
                    </button>
                  </div>
                </div>

                <div class="autocomplete-wrapper">
                  <input
                    type="text"
                    id="contact-target-country"
                    name="targetCountry"
                    placeholder="{{ contactForm.fields.targetCountry.placeholder }}"
                    autocomplete="off"
                  />
                  <div class="autocomplete-dropdown" id="country-autocomplete-dropdown"></div>
                </div>
              </div>
            </div>

            <!-- STEP 2: Property Type and Use -->
            <div class="wizard-step-content" id="step-2" style="display: none;">
              <div class="form-group">
                <label>{{ contactForm.fields.propertyType.label }}</label>
                <div class="property-type-selector" id="property-type-selector">
                  <button type="button" class="property-type-btn" data-value="apartment">
                    <span class="property-icon">🏢</span>
                    <span class="property-label">{{ contactForm.fields.propertyType.options.apartment }}</span>
                  </button>
                  <button type="button" class="property-type-btn" data-value="villa">
                    <span class="property-icon">🏡</span>
                    <span class="property-label">{{ contactForm.fields.propertyType.options.villa }}</span>
                  </button>
                  <button type="button" class="property-type-btn" data-value="building">
                    <span class="property-icon">🏘️</span>
                    <span class="property-label">{{ contactForm.fields.propertyType.options.building }}</span>
                  </button>
                  <button type="button" class="property-type-btn" data-value="commercial">
                    <span class="property-icon">🏪</span>
                    <span class="property-label">{{ contactForm.fields.propertyType.options.commercial }}</span>
                  </button>
                  <button type="button" class="property-type-btn" data-value="parkingBox">
                    <span class="property-icon">🚗</span>
                    <span class="property-label">{{ contactForm.fields.propertyType.options.parkingBox }}</span>
                  </button>
                  <button type="button" class="property-type-btn" data-value="parkingLotIndoor">
                    <span class="property-icon">🏢🅿️</span>
                    <span class="property-label">{{ contactForm.fields.propertyType.options.parkingLotIndoor }}</span>
                  </button>
                  <button type="button" class="property-type-btn" data-value="parkingLotOutdoor">
                    <span class="property-icon">🌳🅿️</span>
                    <span class="property-label">{{ contactForm.fields.propertyType.options.parkingLotOutdoor }}</span>
                  </button>
                </div>
                <input type="hidden" id="contact-property-type" name="propertyType" value="" />
              </div>

              <div class="form-group">
                <label for="contact-exploitation-type">
                  {{ contactForm.fields.exploitationType.label }}
                </label>
                <select id="contact-exploitation-type" name="exploitationType">
                  <option value="">{{ contactForm.fields.exploitationType.options.default }}</option>
                  <option value="Location longue durée">{{ contactForm.fields.exploitationType.options.longTerm }}</option>
                  <option value="Location courte durée (Airbnb)">{{ contactForm.fields.exploitationType.options.shortTerm }}</option>
                  <option value="Mixte">{{ contactForm.fields.exploitationType.options.mixed }}</option>
                  <option value="Revente">{{ contactForm.fields.exploitationType.options.resale }}</option>
                  <option value="Location occasionnelle et/ou usage personnel">{{ contactForm.fields.exploitationType.options.personal }}</option>
                </select>
              </div>
            </div>

            <!-- STEP 3: Business (Budget, Management, Message) -->
            <div class="wizard-step-content" id="step-3" style="display: none;">
              <div class="form-group">
                <label for="contact-budget">
                  {{ contactForm.fields.budget.label }}
                </label>
                <select id="contact-budget" name="budget">
                  <option value="">{{ contactForm.fields.budget.options.default }}</option>
                  <option value="< 50k€">{{ contactForm.fields.budget.options.less50k }}</option>
                  <option value="50k-100k€">{{ contactForm.fields.budget.options.50to100k }}</option>
                  <option value="100k-250k€">{{ contactForm.fields.budget.options.100to250k }}</option>
                  <option value="250k-500k€">{{ contactForm.fields.budget.options.250to500k }}</option>
                  <option value="500k-1M€">{{ contactForm.fields.budget.options.500kto1M }}</option>
                  <option value="> 1M€">{{ contactForm.fields.budget.options.more1M }}</option>
                </select>
              </div>

              <div class="form-group">
                <div class="management-type-section">
                  <label class="management-type-label">{{ contactForm.fields.managementType.label }}</label>
                  <div class="management-type-toggle">
                    <label class="radio-label">
                      <input type="radio" name="managementType" value="professional" required />
                      <span class="radio-text">{{ contactForm.fields.managementType.options.professional }}</span>
                    </label>
                    <label class="radio-label">
                      <input type="radio" name="managementType" value="selfManaged" required />
                      <span class="radio-text">{{ contactForm.fields.managementType.options.selfManaged }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="contact-message">
                  {{ contactForm.fields.message.label }}
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows="3"
                  placeholder="{{ contactForm.fields.message.placeholder }}"
                ></textarea>
              </div>
            </div>

            <!-- STEP 4: Contact Information -->
            <div class="wizard-step-content" id="step-4" style="display: none;">
              <div class="form-group">
                <label for="contact-email">
                  {{ contactForm.fields.email.label }} <span class="required">{{ contactForm.fields.email.required }}</span>
                </label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  required
                  placeholder="{{ contactForm.fields.email.placeholder }}"
                  aria-required="true"
                />
                <span class="form-error" id="email-error"></span>
              </div>

              <div class="form-group">
                <label for="contact-phone">
                  {{ contactForm.fields.phone.label }} <span class="optional">{{ contactForm.fields.phone.optional }}</span>
                </label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  placeholder="{{ contactForm.fields.phone.placeholder }}"
                />
                <span class="form-help">{{ contactForm.fields.phone.help }}</span>
              </div>

              <div class="form-group">
                <label for="contact-name">
                  {{ contactForm.fields.name.label }} <span class="optional">{{ contactForm.fields.name.optional }}</span>
                </label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  placeholder="{{ contactForm.fields.name.placeholder }}"
                />
              </div>
            </div>

            <!-- Message de retour -->
            <div id="contact-feedback" class="contact-feedback" style="display: none;"></div>

            <!-- Navigation buttons -->
            <div class="wizard-navigation">
              <button type="button" class="btn-wizard btn-prev" id="wizard-prev-btn" style="display: none;">
                ← {{ contactForm.wizard.previous }}
              </button>
              <button type="button" class="btn-wizard btn-next" id="wizard-next-btn">
                {{ contactForm.wizard.next }} →
              </button>
              <button type="submit" class="btn-wizard btn-submit" id="contact-submit-btn" style="display: none;">
                <span class="btn-text">{{ contactForm.submit.button }}</span>
                <span class="btn-loader" style="display: none;">{{ contactForm.submit.sending }}</span>
              </button>
            </div>

            <p class="form-disclaimer">
              <small>
                <strong>{{ contactForm.disclaimer.note }}</strong> {{ contactForm.disclaimer.text }}
              </small>
            </p>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * Initialise le formulaire après insertion dans le DOM
   */
  init() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    // Toggle du formulaire
    const toggle = document.getElementById('contact-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => this.toggleForm());
    }

    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Validation en temps réel sur l'email
    const emailInput = document.getElementById('contact-email');
    if (emailInput) {
      emailInput.addEventListener('blur', () => this.validateEmail());
    }

    // Validation en temps réel sur le nom
    const nameInput = document.getElementById('contact-name');
    if (nameInput) {
      nameInput.addEventListener('blur', () => this.validateName());
    }

    // Wizard navigation buttons
    const nextBtn = document.getElementById('wizard-next-btn');
    const prevBtn = document.getElementById('wizard-prev-btn');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }

    // Initialiser le sélecteur de type de propriété
    this.initPropertyTypeSelector();

    // Initialiser le sélecteur de région
    this.initRegionSelector();

    // Initialiser l'autocomplétion des pays
    this.initCountryAutocomplete();

    // Reset to step 1
    this.goToStep(1);
  }

  /**
   * Navigate to a specific step
   */
  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;

    this.currentStep = step;

    // Hide all step contents
    document.querySelectorAll('.wizard-step-content').forEach(content => {
      content.style.display = 'none';
    });

    // Show current step content
    const currentContent = document.getElementById(`step-${step}`);
    if (currentContent) {
      currentContent.style.display = 'block';
    }

    // Update step indicators
    document.querySelectorAll('.wizard-step').forEach(stepEl => {
      const stepNum = parseInt(stepEl.dataset.step);
      stepEl.classList.remove('active', 'completed');

      if (stepNum < step) {
        stepEl.classList.add('completed');
      } else if (stepNum === step) {
        stepEl.classList.add('active');
      }
    });

    // Update navigation buttons
    const prevBtn = document.getElementById('wizard-prev-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    const submitBtn = document.getElementById('contact-submit-btn');

    if (prevBtn) {
      prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
    }

    if (step === this.totalSteps) {
      if (nextBtn) nextBtn.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'inline-block';
    } else {
      if (nextBtn) nextBtn.style.display = 'inline-block';
      if (submitBtn) submitBtn.style.display = 'none';
    }
  }

  /**
   * Go to next step with validation
   */
  nextStep() {
    if (!this.validateCurrentStep()) {
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  /**
   * Go to previous step
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  /**
   * Validate current step
   */
  validateCurrentStep() {
    const lang = window.currentLang || 'fr';

    switch (this.currentStep) {
      case 1:
        // Step 1: Country must be selected
        if (!this.selectedCountry) {
          const message = lang === 'fr'
            ? 'Veuillez sélectionner un pays avant de continuer'
            : 'Please select a country before continuing';
          this.showFeedback(message, 'error');
          return false;
        }
        return true;

      case 2:
        // Step 2: Property type AND exploitation type are required
        const propertyType = document.getElementById('contact-property-type')?.value;
        const exploitationType = document.getElementById('contact-exploitation-type')?.value;

        if (!propertyType) {
          const message = lang === 'fr'
            ? 'Veuillez sélectionner un type de bien'
            : 'Please select a property type';
          this.showFeedback(message, 'error');
          return false;
        }

        if (!exploitationType) {
          const message = lang === 'fr'
            ? 'Veuillez sélectionner un type d\'exploitation'
            : 'Please select an exploitation type';
          this.showFeedback(message, 'error');
          return false;
        }

        return true;

      case 3:
        // Step 3 (Business): Validate management type
        const managementValid = this.validateManagementType();

        if (!managementValid) {
          return false;
        }
        return true;

      case 4:
        // Step 4 (Contact): Validate email only (name is now optional)
        const emailValid = this.validateEmail();

        if (!emailValid) {
          this.showFeedback(
            window.translations?.[lang]?.contactForm?.feedback?.fixErrors || 'Please fix the errors in the form.',
            'error'
          );
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * Initialise le sélecteur de région
   */
  initRegionSelector() {
    const buttons = document.querySelectorAll('.region-btn');
    if (!buttons.length) return;

    // Sélectionner "Toutes les régions" par défaut
    const allButton = document.querySelector('.region-btn[data-region="all"]');
    if (allButton) {
      allButton.classList.add('selected');
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Retirer la sélection des autres boutons
        buttons.forEach(btn => btn.classList.remove('selected'));

        // Sélectionner le bouton cliqué
        button.classList.add('selected');

        // Stocker la région sélectionnée
        this.selectedRegion = button.dataset.region;

        // Vider le champ de recherche et cacher le dropdown
        const input = document.getElementById('contact-target-country');
        if (input) {
          input.value = '';
        }
        this.hideCountryDropdown();
        this.selectedCountry = null;
      });
    });
  }

  /**
   * Initialise le sélecteur de type de propriété avec icônes
   */
  initPropertyTypeSelector() {
    const buttons = document.querySelectorAll('.property-type-btn');
    const hiddenInput = document.getElementById('contact-property-type');

    if (!buttons.length || !hiddenInput) return;

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Retirer la sélection des autres boutons
        buttons.forEach(btn => btn.classList.remove('selected'));

        // Sélectionner le bouton cliqué
        button.classList.add('selected');

        // Mettre à jour le champ caché avec la valeur
        hiddenInput.value = button.dataset.value;

        // Vérifier si on peut passer automatiquement à l'étape suivante
        this.checkStep2Complete();
      });
    });

    // Aussi ajouter un listener sur le select d'exploitation
    const exploitationSelect = document.getElementById('contact-exploitation-type');
    if (exploitationSelect) {
      exploitationSelect.addEventListener('change', () => {
        this.checkStep2Complete();
      });
    }
  }

  /**
   * Vérifie si l'étape 2 est complète et passe à l'étape 3 automatiquement
   */
  checkStep2Complete() {
    // Seulement si on est à l'étape 2
    if (this.currentStep !== 2) return;

    const propertyType = document.getElementById('contact-property-type')?.value;
    const exploitationType = document.getElementById('contact-exploitation-type')?.value;

    // Si les deux sont remplis, passer à l'étape 3
    if (propertyType && exploitationType) {
      // Masquer les messages d'erreur
      this.hideFeedback();

      setTimeout(() => {
        this.nextStep();
      }, 300);
    }
  }

  /**
   * Initialise l'autocomplétion pour le champ pays
   */
  initCountryAutocomplete() {
    const input = document.getElementById('contact-target-country');
    const dropdown = document.getElementById('country-autocomplete-dropdown');

    if (!input || !dropdown) return;

    // Function pour afficher la liste
    const showList = async () => {
      // Si le champ est vide, charger tous les pays
      if (!input.value.trim()) {
        await this.loadAllCountries();
      } else if (dropdown.children.length > 0) {
        // Sinon, réafficher les résultats existants
        dropdown.style.display = 'block';
      }
    };

    // Focus ET Click: afficher tous les pays de la région sélectionnée
    input.addEventListener('focus', showList);
    input.addEventListener('click', showList);

    // Input event avec debounce
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      // Si vide, afficher tous les pays
      if (!query) {
        this.loadAllCountries();
        return;
      }

      // Debounce: attendre 300ms après la dernière frappe
      clearTimeout(this.autocompleteTimeout);
      this.autocompleteTimeout = setTimeout(() => {
        this.searchCountries(query);
      }, 300);
    });

    // Cacher le dropdown quand on clique ailleurs
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        this.hideCountryDropdown();
      }
    });
  }

  /**
   * Charge tous les pays (avec filtre de région optionnel)
   */
  async loadAllCountries() {
    try {
      const lang = window.currentLang || 'fr';

      // Construire l'URL sans limite pour afficher tous les pays
      let apiUrl = `/api/countries?lang=${lang}`;

      if (this.selectedRegion && this.selectedRegion !== 'all') {
        apiUrl += `&region=${this.selectedRegion}`;
      }

      const response = await fetch(window.CONFIG.getApiUrl(apiUrl));
      const data = await response.json();

      if (data.success && data.results.length > 0) {
        // Trier les pays par ordre alphabétique
        const sortedCountries = data.results.sort((a, b) =>
          a.name.localeCompare(b.name, lang)
        );
        this.showCountryDropdown(sortedCountries);
      } else {
        this.hideCountryDropdown();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pays:', error);
      this.hideCountryDropdown();
    }
  }

  /**
   * Recherche les pays via l'API (avec filtre de région optionnel)
   */
  async searchCountries(query) {
    try {
      const lang = window.currentLang || 'fr';

      // Construire l'URL avec le filtre de région si une région est sélectionnée
      let apiUrl = `/api/countries?search=${encodeURIComponent(query)}&lang=${lang}`;

      if (this.selectedRegion && this.selectedRegion !== 'all') {
        apiUrl += `&region=${this.selectedRegion}`;
      }

      const response = await fetch(window.CONFIG.getApiUrl(apiUrl));
      const data = await response.json();

      if (data.success && data.results.length > 0) {
        this.showCountryDropdown(data.results);
      } else {
        this.hideCountryDropdown();
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de pays:', error);
      this.hideCountryDropdown();
    }
  }

  /**
   * Affiche les résultats de l'autocomplétion
   */
  showCountryDropdown(countries) {
    const dropdown = document.getElementById('country-autocomplete-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '';

    countries.forEach(country => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <span class="country-flag">${country.flag}</span>
        <span class="country-name">${country.name}</span>
      `;

      item.addEventListener('click', () => {
        this.selectCountry(country);
      });

      dropdown.appendChild(item);
    });

    dropdown.style.display = 'block';
  }

  /**
   * Cache le dropdown d'autocomplétion
   */
  hideCountryDropdown() {
    const dropdown = document.getElementById('country-autocomplete-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  /**
   * Sélectionne un pays
   */
  selectCountry(country) {
    const input = document.getElementById('contact-target-country');
    if (!input) return;

    // Remplir l'input avec le nom du pays
    input.value = `${country.flag} ${country.name}`;
    this.selectedCountry = country;

    // Cacher le dropdown
    this.hideCountryDropdown();

    // Masquer les messages d'erreur
    this.hideFeedback();

    // Passer automatiquement à l'étape suivante si on est à l'étape 1
    if (this.currentStep === 1) {
      // Petit délai pour une meilleure UX
      setTimeout(() => {
        this.nextStep();
      }, 300);
    }
  }

  /**
   * Toggle l'affichage du formulaire
   */
  toggleForm() {
    const wrapper = document.getElementById('contact-form-wrapper');
    const toggle = document.getElementById('contact-toggle');
    const arrow = toggle?.querySelector('.contact-toggle-arrow');

    if (!wrapper) return;

    const isHidden = wrapper.style.display === 'none';

    if (isHidden) {
      // Ouvrir
      wrapper.style.display = 'block';
      toggle?.classList.add('active');
      if (arrow) arrow.style.transform = 'rotate(180deg)';

      // Smooth scroll vers le formulaire
      setTimeout(() => {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } else {
      // Fermer
      wrapper.style.display = 'none';
      toggle?.classList.remove('active');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
  }

  /**
   * Ferme le formulaire (utilisé après soumission réussie)
   */
  closeForm() {
    const wrapper = document.getElementById('contact-form-wrapper');
    const toggle = document.getElementById('contact-toggle');
    const arrow = toggle?.querySelector('.contact-toggle-arrow');

    if (!wrapper) return;

    // Fermer
    wrapper.style.display = 'none';
    toggle?.classList.remove('active');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }

  /**
   * Affiche un message toast sous le bandeau de contact
   */
  showToast(message, type = 'success') {
    // Supprimer tout toast existant
    const existingToast = document.getElementById('contact-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Créer le toast
    const toast = document.createElement('div');
    toast.id = 'contact-toast';
    toast.className = `contact-toast contact-toast-${type}`;
    toast.textContent = message;

    // Insérer après le toggle du formulaire
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
      const toggle = document.getElementById('contact-toggle');
      if (toggle && toggle.nextSibling) {
        contactSection.insertBefore(toast, toggle.nextSibling);
      } else {
        contactSection.appendChild(toast);
      }
    }

    // Animation d'apparition
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Scroll vers le toast
    setTimeout(() => {
      toast.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);

    // Auto-hide après 8 secondes
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 8000);
  }

  /**
   * Valide l'email
   */
  validateEmail() {
    const emailInput = document.getElementById('contact-email');
    const errorSpan = document.getElementById('email-error');

    if (!emailInput || !errorSpan) return false;

    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errorSpan.textContent = window.translations[window.currentLang]?.contactForm?.fields?.email?.errors?.required || 'Email is required';
      emailInput.classList.add('error');
      return false;
    }

    if (!emailRegex.test(email)) {
      errorSpan.textContent = window.translations[window.currentLang]?.contactForm?.fields?.email?.errors?.invalid || 'Please enter a valid email';
      emailInput.classList.add('error');
      return false;
    }

    errorSpan.textContent = '';
    emailInput.classList.remove('error');
    return true;
  }

  /**
   * Valide le nom
   */
  validateName() {
    const nameInput = document.getElementById('contact-name');
    const errorSpan = document.getElementById('name-error');

    if (!nameInput || !errorSpan) return true;

    const name = nameInput.value.trim();

    // If empty, return true since name is optional
    if (!name) {
      errorSpan.textContent = '';
      nameInput.classList.remove('error');
      return true;
    }

    // Only validate format if a value is provided
    if (name.length < 2) {
      errorSpan.textContent = window.translations[window.currentLang]?.contactForm?.fields?.name?.errors?.minLength || 'Name must be at least 2 characters';
      nameInput.classList.add('error');
      return false;
    }

    errorSpan.textContent = '';
    nameInput.classList.remove('error');
    return true;
  }

  /**
   * Valide qu'un type de gestion est sélectionné
   */
  validateManagementType() {
    const managementTypeRadios = document.getElementsByName('managementType');
    const isSelected = Array.from(managementTypeRadios).some(radio => radio.checked);

    if (!isSelected) {
      const lang = window.currentLanguage || 'fr';
      const message = lang === 'fr'
        ? 'Veuillez sélectionner un type de gestion'
        : 'Please select a management type';
      this.showFeedback(message, 'error');
      return false;
    }

    return true;
  }

  /**
   * Gère la soumission du formulaire
   */
  async handleSubmit(e) {
    e.preventDefault();

    if (this.isSubmitting) return;

    // Validation
    const emailValid = this.validateEmail();
    const nameValid = this.validateName();
    const managementTypeValid = this.validateManagementType();

    if (!emailValid || !nameValid || !managementTypeValid) {
      this.showFeedback(
        window.translations[window.currentLang]?.contactForm?.feedback?.fixErrors || 'Please fix the errors in the form.',
        'error'
      );
      return;
    }

    // Récupérer le type de gestion sélectionné
    const managementTypeRadios = document.getElementsByName('managementType');
    const managementType = Array.from(managementTypeRadios).find(radio => radio.checked)?.value || '';

    // Récupérer les données
    const formData = {
      name: document.getElementById('contact-name').value.trim(),
      email: document.getElementById('contact-email').value.trim().toLowerCase(),
      phone: document.getElementById('contact-phone').value.trim(),
      budget: document.getElementById('contact-budget').value,
      targetCountry: document.getElementById('contact-target-country').value.trim(),
      propertyType: document.getElementById('contact-property-type').value,
      managementType: managementType,
      exploitationType: document.getElementById('contact-exploitation-type').value,
      message: document.getElementById('contact-message').value.trim()
    };

    // UI: Mode soumission
    this.isSubmitting = true;
    this.setSubmitButton(true);
    this.hideFeedback();

    try {
      // Envoyer au backend
      const apiUrl = window.CONFIG.getApiUrl('/api/contact');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Succès - Fermer le formulaire et afficher un toast

        // Réinitialiser le formulaire
        document.getElementById('contact-form').reset();

        // Réinitialiser les boutons de type de propriété
        document.querySelectorAll('.property-type-btn').forEach(btn => btn.classList.remove('selected'));

        // Revenir à l'étape 1
        this.goToStep(1);

        // Fermer le formulaire
        this.closeForm();

        // Afficher le toast de succès
        const successMessage = window.translations?.[window.currentLang]?.contactForm?.feedback?.success || '✅ Perfect! We\'ve sent you a confirmation email. Check your inbox and click on the confirmation link to finalize your request.';
        this.showToast(successMessage, 'success');

      } else {
        // Erreur du backend
        const errorMsg = window.translations[window.currentLang]?.contactForm?.feedback?.errorGeneric || 'An error occurred. Please try again.';
        this.showFeedback(
          `❌ ${result.error || errorMsg}`,
          'error'
        );
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      this.showFeedback(
        window.translations[window.currentLang]?.contactForm?.feedback?.errorNetwork || '❌ Unable to contact the server. Check your connection and try again.',
        'error'
      );
    } finally {
      this.isSubmitting = false;
      this.setSubmitButton(false);
    }
  }

  /**
   * Affiche un message de retour
   */
  showFeedback(message, type) {
    const feedback = document.getElementById('contact-feedback');
    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = `contact-feedback contact-feedback-${type}`;
    feedback.style.display = 'block';
  }

  /**
   * Masque le message de retour
   */
  hideFeedback() {
    const feedback = document.getElementById('contact-feedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  }

  /**
   * Gère l'état du bouton de soumission
   */
  setSubmitButton(isLoading) {
    const btn = document.getElementById('contact-submit-btn');
    if (!btn) return;

    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    if (isLoading) {
      btn.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline';
    } else {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }
}

// Export singleton
window.ContactFormModule = new ContactFormModule();
