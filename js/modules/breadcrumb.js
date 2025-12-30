// ==========================================
// BREADCRUMB MODULE
// ==========================================

(function() {
    'use strict';

    const BreadcrumbModule = {
        breadcrumbEl: null,
        currentTopicEl: null,
        homeBtn: null,
        separatorEl: null,

        /**
         * Initialize the breadcrumb module
         */
        init() {
            this.breadcrumbEl = document.getElementById('breadcrumb');
            this.currentTopicEl = document.getElementById('current-topic');
            this.homeBtn = document.getElementById('home-btn');
            this.separatorEl = document.querySelector('.breadcrumb-separator');

            if (!this.breadcrumbEl || !this.currentTopicEl || !this.homeBtn || !this.separatorEl) {
                console.error('Breadcrumb: Required elements not found');
                return;
            }

            // Setup home button click handler
            this.homeBtn.addEventListener('click', () => {
                console.log('Breadcrumb: Home button clicked');
                if (window.PickAndTip && window.PickAndTip.navigateTo) {
                    console.log('Breadcrumb: Navigating to landing page');
                    window.PickAndTip.navigateTo('');
                } else {
                    console.error('Breadcrumb: PickAndTip.navigateTo not available');
                }
            });

            console.log('Breadcrumb module initialized');
        },

        /**
         * Show breadcrumb with topic name
         * @param {string} topicName - The name of the current topic
         */
        show(topicName) {
            if (!this.breadcrumbEl || !this.currentTopicEl || !this.separatorEl) {
                console.error('Breadcrumb: Elements not initialized');
                return;
            }

            this.currentTopicEl.textContent = topicName;
            this.breadcrumbEl.classList.remove('hidden');
            this.separatorEl.classList.remove('hidden');
            this.currentTopicEl.classList.remove('hidden');
            this.homeBtn.classList.remove('disabled');
            console.log('Breadcrumb shown for:', topicName);
        },

        /**
         * Show only the Home button (for landing page)
         */
        showHomeOnly() {
            if (!this.breadcrumbEl || !this.currentTopicEl || !this.separatorEl) {
                console.error('Breadcrumb: Elements not initialized');
                return;
            }

            console.log('Breadcrumb.showHomeOnly() called');
            this.breadcrumbEl.classList.remove('hidden');
            this.separatorEl.classList.add('hidden');
            this.currentTopicEl.classList.add('hidden');
            this.homeBtn.classList.add('disabled');
            console.log('Breadcrumb showing home only');
        },

        /**
         * Update breadcrumb text (useful when language changes)
         * @param {string} topicName - The new topic name
         */
        updateText(topicName) {
            if (!this.currentTopicEl) {
                console.error('Breadcrumb: Current topic element not initialized');
                return;
            }

            this.currentTopicEl.textContent = topicName;
        },

        /**
         * Check if breadcrumb is currently visible
         * @returns {boolean}
         */
        isVisible() {
            if (!this.breadcrumbEl) return false;
            return !this.breadcrumbEl.classList.contains('hidden');
        }
    };

    // Export to global scope
    window.BreadcrumbModule = BreadcrumbModule;

})();
