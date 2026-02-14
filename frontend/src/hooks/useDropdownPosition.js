import { useState, useEffect } from 'react';

/**
 * Hook to calculate dropdown position (top or bottom) based on available viewport space
 * @param {React.RefObject} triggerRef - Reference to the button/trigger element
 * @param {boolean} isOpen - Whether the dropdown is open
 * @param {number} dropdownHeight - Estimated height of dropdown (default: 300px)
 * @returns {string} - CSS classes for positioning ('bottom-full mb-2' for top, 'top-full mt-2' for bottom)
 */
export const useDropdownPosition = (triggerRef, isOpen, dropdownHeight = 300) => {
  const [position, setPosition] = useState('bottom');

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const calculatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If not enough space below but enough space above, open upward
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    };

    calculatePosition();

    // Recalculate on scroll or resize
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, triggerRef, dropdownHeight]);

  return position;
};

/**
 * Get CSS classes for dropdown positioning
 * @param {string} position - 'top' or 'bottom'
 * @returns {string} - CSS classes
 */
export const getDropdownClasses = (position) => {
  return position === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2';
};
