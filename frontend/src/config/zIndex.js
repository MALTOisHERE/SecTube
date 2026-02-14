/**
 * Centralized z-index management
 * Ensures proper layering across the entire application
 *
 * Layering order (bottom to top):
 * 1. Base content (0)
 * 2. Sidebar overlay (1)
 * 3. Sidebar (2)
 * 4. Navbar (3)
 * 5. Dropdowns (50)
 * 6. Modal overlay & dialog (999999)
 * 7. Toast notifications (1000000)
 */

export const Z_INDEX = {
  // Base layers
  BASE: 0,

  // Navigation elements
  SIDEBAR_OVERLAY: 1,
  SIDEBAR: 2,
  NAVBAR: 3,

  // Dropdowns and popovers
  DROPDOWN: 50,

  // Modals and dialogs (very high to appear above everything)
  MODAL_OVERLAY: 999999,
  MODAL: 999999,

  // Notifications (highest - always on top)
  TOAST: 1000000,
};

export default Z_INDEX;
