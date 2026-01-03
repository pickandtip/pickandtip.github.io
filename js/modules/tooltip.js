/**
 * Tooltip Module - Unified tooltip system for Pick and Tip
 *
 * Features:
 * - Smart positioning (auto-adjust based on viewport)
 * - Lockable tooltips for debugging
 * - Color coding: gold for content, muted for empty
 * - Consistent behavior across the application
 */

window.TooltipModule = (function() {
    'use strict';

    /**
     * Create a tooltip cell with icon and tooltip
     * @param {Object} config Configuration object
     * @param {string} config.mainContent - HTML content before/after the icon
     * @param {string} config.tooltipContent - Tooltip HTML content
     * @param {string} config.cellClass - Class for the wrapper cell
     * @param {string} config.iconClass - Unique class for the icon
     * @param {string} config.tooltipClass - Class for the tooltip
     * @param {string} [config.position] - DEPRECATED: position is now auto-deduced from iconFirst
     * @param {boolean} [config.iconFirst=false] - true = icon before content (tooltip shows left), false = icon after content (tooltip shows right)
     * @param {boolean} [config.isEmpty=false] - true = no additional info (muted color), false = has content (gold color)
     * @returns {string} HTML string for the tooltip cell
     */
    function createTooltipCell(config) {
        const {
            mainContent,
            tooltipContent,
            cellClass,
            iconClass,
            tooltipClass,
            iconFirst = false,
            isEmpty = false
        } = config;

        // Auto-deduce position from iconFirst
        // iconFirst=true (icon on LEFT of text) → tooltip shows on LEFT
        // iconFirst=false (icon on RIGHT of text) → tooltip shows on RIGHT
        const autoPosition = iconFirst ? 'left' : 'right';

        // Add lock icon if lockable mode is enabled
        const lockIcon = window.PickAndTip?.tooltipLockableMode
            ? '<span class="tooltip-lock-icon" title="Verrouiller le tooltip">🔓</span>'
            : '';

        // Add 'empty' class if no additional info
        const emptyClass = isEmpty ? ' empty' : '';

        const iconHtml = `<span class="info-icon smart-tooltip-icon ${iconClass}${emptyClass}" data-position="${autoPosition}">
                    ⓘ
                    <span class="custom-tooltip ${tooltipClass}">${lockIcon}${tooltipContent}</span>
                </span>`;

        return `
            <div class="${cellClass}">
                ${iconFirst ? iconHtml + mainContent : mainContent + iconHtml}
            </div>
        `;
    }

    /**
     * Adjust tooltip position based on viewport and container boundaries
     * @param {HTMLElement} icon - The icon element containing the tooltip
     */
    function setupSmartTooltip(icon) {
        if (!icon) return;

        const tooltip = icon.querySelector('.custom-tooltip');
        if (!tooltip) return;

        const preferredPosition = icon.getAttribute('data-position') || 'right';

        // Wait for tooltip to be displayed to get accurate dimensions
        setTimeout(() => {
            const iconRect = icon.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const tableScrollContainer = document.querySelector('.table-scroll');
            const containerTop = tableScrollContainer ? tableScrollContainer.getBoundingClientRect().top : 0;
            const containerBottom = tableScrollContainer ? tableScrollContainer.getBoundingClientRect().bottom : viewportHeight;

            // Remove any previous positioning classes
            tooltip.classList.remove('tooltip-top', 'tooltip-bottom', 'tooltip-left', 'tooltip-right');

            // Horizontal positioning
            if (preferredPosition === 'left') {
                tooltip.classList.add('tooltip-left');
            } else {
                tooltip.classList.add('tooltip-right');
            }

            // Vertical positioning - calculate where the tooltip would be if centered
            const tooltipCenterTop = iconRect.top + iconRect.height / 2 - tooltipRect.height / 2;
            const tooltipCenterBottom = tooltipCenterTop + tooltipRect.height;

            // Check if tooltip would overflow at the top
            if (tooltipCenterTop < containerTop) {
                tooltip.classList.add('tooltip-top');
            }
            // Check if tooltip would overflow at the bottom
            else if (tooltipCenterBottom > Math.min(viewportHeight, containerBottom)) {
                tooltip.classList.add('tooltip-bottom');
            }
        }, 10);
    }

    /**
     * Initialize tooltip event listeners for a container
     * Handles click, hover, and lock functionality
     * @param {HTMLElement} container - The container element (e.g., table row)
     */
    function initializeTooltips(container) {
        const smartTooltips = container.querySelectorAll('.smart-tooltip-icon');

        smartTooltips.forEach(icon => {
            if (!icon) return;

            const tooltip = icon.querySelector('.custom-tooltip');
            const lockIcon = tooltip?.querySelector('.tooltip-lock-icon');
            let closeTimeout;

            // Lock icon click handler
            if (lockIcon) {
                lockIcon.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const isCurrentlyLocked = icon.classList.contains('locked');

                    if (isCurrentlyLocked) {
                        // Unlock
                        icon.classList.remove('locked');
                        this.textContent = '🔓';
                        this.title = 'Verrouiller le tooltip';
                    } else {
                        // Lock
                        icon.classList.add('locked');
                        this.textContent = '🔒';
                        this.title = 'Déverrouiller le tooltip';
                        // Ensure tooltip stays open
                        icon.classList.add('active');
                    }
                });
            }

            // Icon click handler
            icon.addEventListener('click', function(e) {
                e.stopPropagation();
                // Close all other tooltips (except locked ones)
                document.querySelectorAll('.info-icon.active').forEach(otherIcon => {
                    if (otherIcon !== this && !otherIcon.classList.contains('locked')) {
                        otherIcon.classList.remove('active');
                    }
                });
                // Toggle this tooltip (only if not locked)
                if (!this.classList.contains('locked')) {
                    this.classList.toggle('active');
                } else {
                    this.classList.add('active');
                }

                // Adjust tooltip position if active
                if (this.classList.contains('active')) {
                    setupSmartTooltip(this);
                }
            });

            // Delay closing when mouse leaves the icon (only if not locked)
            icon.addEventListener('mouseleave', function() {
                if (!this.classList.contains('locked')) {
                    closeTimeout = setTimeout(() => {
                        this.classList.remove('active');
                    }, 200);
                }
            });

            // Cancel closing if mouse enters the icon again
            icon.addEventListener('mouseenter', function() {
                clearTimeout(closeTimeout);
            });

            // Keep tooltip open when mouse is over it
            if (tooltip) {
                tooltip.addEventListener('mouseenter', function() {
                    clearTimeout(closeTimeout);
                    // Ensure active state when locked
                    if (icon.classList.contains('locked')) {
                        icon.classList.add('active');
                    }
                });

                // Close when mouse leaves the tooltip (only if not locked)
                tooltip.addEventListener('mouseleave', function() {
                    if (!icon.classList.contains('locked')) {
                        icon.classList.remove('active');
                    } else {
                        // Keep active class when locked
                        icon.classList.add('active');
                    }
                });
            }
        });
    }

    /**
     * Close all active tooltips (except locked ones)
     * Typically called when clicking outside
     */
    function closeAllTooltips() {
        document.querySelectorAll('.info-icon.active').forEach(icon => {
            if (!icon.classList.contains('locked')) {
                icon.classList.remove('active');
            }
        });
    }

    /**
     * Unlock all locked tooltips
     */
    function unlockAllTooltips() {
        document.querySelectorAll('.info-icon.locked').forEach(icon => {
            icon.classList.remove('locked');
            icon.classList.remove('active');

            // Update lock icon if present
            const lockIcon = icon.querySelector('.tooltip-lock-icon');
            if (lockIcon) {
                lockIcon.textContent = '🔓';
                lockIcon.title = 'Verrouiller le tooltip';
            }
        });

        updateUnlockButton();
    }

    /**
     * Get count of currently locked tooltips
     * @returns {number} Number of locked tooltips
     */
    function getLockedTooltipsCount() {
        return document.querySelectorAll('.info-icon.locked').length;
    }

    /**
     * Update the unlock button visibility
     */
    function updateUnlockButton() {
        const unlockBtn = document.getElementById('unlock-all-tooltips');
        if (!unlockBtn) return;

        const count = getLockedTooltipsCount();

        if (count > 0) {
            unlockBtn.classList.remove('hidden');
        } else {
            unlockBtn.classList.add('hidden');
        }
    }

    /**
     * Create unlock all button to be inserted in result-count area
     * @returns {HTMLElement} The unlock button element
     */
    function createUnlockButton() {
        const button = document.createElement('button');
        button.id = 'unlock-all-tooltips';
        button.className = 'unlock-all-btn hidden'; // Hidden by default
        button.innerHTML = `
            <span class="unlock-icon">🔓</span>
            <span class="unlock-text">Tout déverrouiller</span>
        `;

        button.addEventListener('click', unlockAllTooltips);

        return button;
    }

    /**
     * Initialize global keyboard shortcuts (called once on app start)
     */
    function initGlobalListeners() {
        // Escape key to unlock all tooltips (only bind once)
        if (!window._tooltipEscapeListenerBound) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' || e.key === 'Esc') {
                    const lockedCount = getLockedTooltipsCount();
                    if (lockedCount > 0) {
                        unlockAllTooltips();
                        e.preventDefault(); // Prevent default Escape behavior
                    }
                }
            });
            window._tooltipEscapeListenerBound = true;
        }
    }

    /**
     * Initialize unlock button for current view (called after each view loads)
     */
    function initUnlockButton() {
        // Insert unlock button in all result-count areas
        const resultCountContainers = document.querySelectorAll('.result-count');
        resultCountContainers.forEach(container => {
            // Check if button already exists
            if (!container.querySelector('#unlock-all-tooltips')) {
                const unlockBtn = createUnlockButton();
                container.appendChild(unlockBtn);
            }
        });
    }

    /**
     * Initialize tooltip event listeners for a container
     * Handles click, hover, and lock functionality
     * @param {HTMLElement} container - The container element (e.g., table row)
     */
    function initializeTooltips(container) {
        const smartTooltips = container.querySelectorAll('.smart-tooltip-icon');

        smartTooltips.forEach(icon => {
            if (!icon) return;

            const tooltip = icon.querySelector('.custom-tooltip');
            const lockIcon = tooltip?.querySelector('.tooltip-lock-icon');
            let closeTimeout;

            // Lock icon click handler
            if (lockIcon) {
                lockIcon.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const isCurrentlyLocked = icon.classList.contains('locked');

                    if (isCurrentlyLocked) {
                        // Unlock
                        icon.classList.remove('locked');
                        this.textContent = '🔓';
                        this.title = 'Verrouiller le tooltip';
                    } else {
                        // Lock
                        icon.classList.add('locked');
                        this.textContent = '🔒';
                        this.title = 'Déverrouiller le tooltip';
                        // Ensure tooltip stays open
                        icon.classList.add('active');
                    }

                    // Update unlock button count
                    updateUnlockButton();
                });
            }

            // Icon click handler
            icon.addEventListener('click', function(e) {
                e.stopPropagation();
                // Close all other tooltips (except locked ones)
                document.querySelectorAll('.info-icon.active').forEach(otherIcon => {
                    if (otherIcon !== this && !otherIcon.classList.contains('locked')) {
                        otherIcon.classList.remove('active');
                    }
                });
                // Toggle this tooltip (only if not locked)
                if (!this.classList.contains('locked')) {
                    this.classList.toggle('active');
                } else {
                    this.classList.add('active');
                }

                // Adjust tooltip position if active
                if (this.classList.contains('active')) {
                    setupSmartTooltip(this);
                }
            });

            // Delay closing when mouse leaves the icon (only if not locked)
            icon.addEventListener('mouseleave', function() {
                if (!this.classList.contains('locked')) {
                    closeTimeout = setTimeout(() => {
                        this.classList.remove('active');
                    }, 200);
                }
            });

            // Cancel closing if mouse enters the icon again
            icon.addEventListener('mouseenter', function() {
                clearTimeout(closeTimeout);
            });

            // Keep tooltip open when mouse is over it
            if (tooltip) {
                tooltip.addEventListener('mouseenter', function() {
                    clearTimeout(closeTimeout);
                    // Ensure active state when locked
                    if (icon.classList.contains('locked')) {
                        icon.classList.add('active');
                    }
                });

                // Close when mouse leaves the tooltip (only if not locked)
                tooltip.addEventListener('mouseleave', function() {
                    if (!icon.classList.contains('locked')) {
                        icon.classList.remove('active');
                    } else {
                        // Keep active class when locked
                        icon.classList.add('active');
                    }
                });
            }
        });
    }

    // Public API
    return {
        createTooltipCell,
        setupSmartTooltip,
        initializeTooltips,
        closeAllTooltips,
        unlockAllTooltips,
        getLockedTooltipsCount,
        initGlobalListeners,
        initUnlockButton
    };
})();
