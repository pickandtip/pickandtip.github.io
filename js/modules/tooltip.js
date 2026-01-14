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
     * @param {string} [config.position] - Optional override for tooltip position ('left' or 'right'). If not provided, auto-deduced from iconFirst
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
            position,
            iconFirst = false,
            isEmpty = false
        } = config;

        // Auto-deduce position from iconFirst if not explicitly provided
        // iconFirst=true (icon on LEFT of text) → tooltip shows on LEFT
        // iconFirst=false (icon on RIGHT of text) → tooltip shows on RIGHT
        // BUT: allow manual override via position parameter (e.g., for warning triangles)
        const tooltipPosition = position || (iconFirst ? 'left' : 'right');

        // Add lock icon if lockable mode is enabled
        const lockIcon = window.PickAndTip?.tooltipLockableMode
            ? '<span class="tooltip-lock-icon" title="Verrouiller le tooltip">🔓</span>'
            : '';

        // Add 'empty' class if no additional info
        const emptyClass = isEmpty ? ' empty' : '';

        const iconHtml = `<span class="info-icon smart-tooltip-icon ${iconClass}${emptyClass}" data-position="${tooltipPosition}">
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
     * Hide a tooltip by resetting its visibility
     * @param {HTMLElement} icon - The icon element containing the tooltip
     */
    function hideTooltip(icon) {
        if (!icon) return;

        // Try to get tooltip from icon's reference first (when moved to body)
        const tooltip = icon._tooltip || icon.querySelector('.custom-tooltip');
        if (!tooltip) return;

        tooltip.style.display = 'none';
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
        tooltip.style.left = '-9999px';
        tooltip.style.top = '-9999px';
    }

    /**
     * Adjust tooltip position based on viewport and container boundaries
     * @param {HTMLElement} icon - The icon element containing the tooltip
     */
    function setupSmartTooltip(icon) {
        if (!icon) return;

        // Try to get tooltip from icon's reference first (when moved to body)
        let tooltip = icon._tooltip || icon.querySelector('.custom-tooltip');
        if (!tooltip) return;

        // Store reference on the icon so we can find it later
        if (!icon._tooltip) {
            icon._tooltip = tooltip;
        }

        const preferredPosition = icon.getAttribute('data-position') || 'right';
        const iconRect = icon.getBoundingClientRect();
        const spacing = 12; // 0.75rem = 12px

        // Move tooltip to body to escape any overflow clipping
        // Store original parent so we can put it back later if needed
        if (!tooltip.dataset.originalParent) {
            tooltip.dataset.originalParent = 'stored';
            tooltip._originalParent = tooltip.parentNode;
        }

        if (tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
        }

        // First, position tooltip near the icon but invisible to measure it
        tooltip.style.display = 'block';
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
        tooltip.style.left = `${iconRect.right + spacing}px`;
        tooltip.style.top = `${iconRect.top}px`;

        // Wait for the browser to render and get accurate dimensions
        requestAnimationFrame(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Remove any previous positioning classes
            tooltip.classList.remove('tooltip-top', 'tooltip-bottom', 'tooltip-left', 'tooltip-right');

            // Calculate base positions using fixed positioning
            let tooltipLeft, tooltipTop;

            // Horizontal positioning
            if (preferredPosition === 'left') {
                tooltip.classList.add('tooltip-left');
                tooltipLeft = iconRect.left - tooltipRect.width - spacing;
            } else {
                tooltip.classList.add('tooltip-right');
                tooltipLeft = iconRect.right + spacing;
            }

            // Vertical positioning - try to center on icon
            tooltipTop = iconRect.top + (iconRect.height / 2) - (tooltipRect.height / 2);

            // Check if tooltip would overflow at the top
            if (tooltipTop < 10) {
                tooltip.classList.add('tooltip-top');
                tooltipTop = 10; // 10px from top
            }
            // Check if tooltip would overflow at the bottom
            else if (tooltipTop + tooltipRect.height > viewportHeight - 10) {
                tooltip.classList.add('tooltip-bottom');
                tooltipTop = viewportHeight - tooltipRect.height - 10; // 10px from bottom
            }

            // Check horizontal overflow and flip if needed
            if (tooltipLeft < 10) {
                // Would overflow left, flip to right
                tooltip.classList.remove('tooltip-left');
                tooltip.classList.add('tooltip-right');
                tooltipLeft = iconRect.right + spacing;
            } else if (tooltipLeft + tooltipRect.width > viewportWidth - 10) {
                // Would overflow right, flip to left
                tooltip.classList.remove('tooltip-right');
                tooltip.classList.add('tooltip-left');
                tooltipLeft = iconRect.left - tooltipRect.width - spacing;
            }

            // Apply the calculated positions and make visible
            tooltip.style.left = `${tooltipLeft}px`;
            tooltip.style.top = `${tooltipTop}px`;
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
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
                        setupSmartTooltip(icon);
                    }

                    // Update unlock button count
                    updateUnlockButton();
                });
            }

            // Icon click handler
            icon.addEventListener('click', function(e) {
                e.stopPropagation();
                // Close all other tooltips (except locked ones)
                document.querySelectorAll('.info-icon.active, .smart-tooltip-icon.active').forEach(otherIcon => {
                    if (otherIcon !== this && !otherIcon.classList.contains('locked')) {
                        otherIcon.classList.remove('active');
                        hideTooltip(otherIcon);
                    }
                });
                // Toggle this tooltip (only if not locked)
                if (!this.classList.contains('locked')) {
                    const wasActive = this.classList.contains('active');
                    this.classList.toggle('active');

                    if (this.classList.contains('active')) {
                        setupSmartTooltip(this);
                    } else {
                        hideTooltip(this);
                    }
                } else {
                    this.classList.add('active');
                    setupSmartTooltip(this);
                }
            });

            // Delay closing when mouse leaves the icon (only if not locked)
            icon.addEventListener('mouseleave', function() {
                if (!this.classList.contains('locked')) {
                    closeTimeout = setTimeout(() => {
                        this.classList.remove('active');
                        hideTooltip(this);
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
                        hideTooltip(icon);
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
        document.querySelectorAll('.info-icon.active, .smart-tooltip-icon.active').forEach(icon => {
            if (!icon.classList.contains('locked')) {
                icon.classList.remove('active');
                hideTooltip(icon);
            }
        });
    }

    /**
     * Unlock all locked tooltips
     */
    function unlockAllTooltips() {
        document.querySelectorAll('.info-icon.locked, .smart-tooltip-icon.locked').forEach(icon => {
            icon.classList.remove('locked');
            icon.classList.remove('active');
            hideTooltip(icon);

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
        return document.querySelectorAll('.info-icon.locked, .smart-tooltip-icon.locked').length;
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

        // Recalculate tooltip positions on scroll and resize
        if (!window._tooltipScrollListenerBound) {
            let scrollTimeout;
            const recalculateActiveTooltips = () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    document.querySelectorAll('.info-icon.active, .smart-tooltip-icon.active').forEach(icon => {
                        setupSmartTooltip(icon);
                    });
                }, 10);
            };

            // Listen to scroll on table-scroll containers
            document.addEventListener('scroll', recalculateActiveTooltips, true);
            window.addEventListener('resize', recalculateActiveTooltips);
            window._tooltipScrollListenerBound = true;
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
                document.querySelectorAll('.info-icon.active, .smart-tooltip-icon.active').forEach(otherIcon => {
                    if (otherIcon !== this && !otherIcon.classList.contains('locked')) {
                        otherIcon.classList.remove('active');
                        hideTooltip(otherIcon);
                    }
                });
                // Toggle this tooltip (only if not locked)
                if (!this.classList.contains('locked')) {
                    const wasActive = this.classList.contains('active');
                    this.classList.toggle('active');

                    if (this.classList.contains('active')) {
                        setupSmartTooltip(this);
                    } else {
                        hideTooltip(this);
                    }
                } else {
                    this.classList.add('active');
                    setupSmartTooltip(this);
                }
            });

            // Delay closing when mouse leaves the icon (only if not locked)
            icon.addEventListener('mouseleave', function() {
                if (!this.classList.contains('locked')) {
                    closeTimeout = setTimeout(() => {
                        this.classList.remove('active');
                        hideTooltip(this);
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
                        hideTooltip(icon);
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
