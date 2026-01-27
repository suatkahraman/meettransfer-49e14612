// Form validation animation utilities
// Add shake animation for invalid form fields

// Shake animation trigger with optional auto-scroll
export const triggerShake = (elementId: string, shouldScroll: boolean = false) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add('animate-shake', 'form-error');
    
    if (shouldScroll) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus?.();
    }
    
    setTimeout(() => {
      element.classList.remove('animate-shake');
    }, 500);
  }
};

export const clearError = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove('form-error', 'animate-shake');
  }
};

// Scroll to first error and focus it
export const scrollToFirstError = (fieldIds: string[]) => {
  for (const fieldId of fieldIds) {
    const element = document.getElementById(fieldId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Focus the input if it's focusable
      const focusableElement = element.querySelector('input, select, textarea') as HTMLElement;
      if (focusableElement) {
        setTimeout(() => focusableElement.focus(), 300);
      } else if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
        setTimeout(() => element.focus(), 300);
      }
      
      // Add shake animation
      element.classList.add('animate-shake', 'form-error');
      setTimeout(() => {
        element.classList.remove('animate-shake');
      }, 500);
      
      return; // Only scroll to first error
    }
  }
};

// Validation function with animation
export const validateField = (
  value: string | undefined,
  fieldId: string,
  required: boolean = true
): boolean => {
  const element = document.getElementById(fieldId);
  
  if (!element) return true;

  if (required && (!value || value.trim() === '')) {
    element.classList.add('animate-shake', 'form-error');
    setTimeout(() => {
      element.classList.remove('animate-shake');
    }, 500);
    return false;
  }

  element.classList.remove('form-error');
  return true;
};

// Highlight multiple fields with errors and scroll to first
export const highlightErrors = (errorFieldIds: string[]) => {
  // Add error styling to all fields
  errorFieldIds.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.classList.add('form-error');
    }
  });
  
  // Scroll to first error
  if (errorFieldIds.length > 0) {
    scrollToFirstError(errorFieldIds);
  }
};
