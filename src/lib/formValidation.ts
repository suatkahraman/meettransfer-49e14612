// Form validation animation utilities
// Uses requestAnimationFrame to batch DOM reads/writes and avoid forced reflows

// Shake animation trigger with optional auto-scroll
export const triggerShake = (elementId: string, shouldScroll: boolean = false) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Batch all DOM writes in a single rAF
  requestAnimationFrame(() => {
    element.classList.add('animate-shake', 'form-error');

    if (shouldScroll) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus?.();
    }

    setTimeout(() => {
      requestAnimationFrame(() => {
        element.classList.remove('animate-shake');
      });
    }, 500);
  });
};

export const clearError = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  requestAnimationFrame(() => {
    element.classList.remove('form-error', 'animate-shake');
  });
};

// Scroll to first error and focus it
export const scrollToFirstError = (fieldIds: string[]) => {
  for (const fieldId of fieldIds) {
    const element = document.getElementById(fieldId);
    if (!element) continue;

    // Batch read then write in separate rAF frames
    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('animate-shake', 'form-error');

      // Focus after scroll animation starts
      const focusableElement = element.querySelector('input, select, textarea') as HTMLElement;
      const target = focusableElement || 
        (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName) ? element : null);
      
      if (target) {
        setTimeout(() => target.focus(), 300);
      }

      setTimeout(() => {
        requestAnimationFrame(() => {
          element.classList.remove('animate-shake');
        });
      }, 500);
    });

    return; // Only scroll to first error
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
    requestAnimationFrame(() => {
      element.classList.add('animate-shake', 'form-error');
      setTimeout(() => {
        requestAnimationFrame(() => {
          element.classList.remove('animate-shake');
        });
      }, 500);
    });
    return false;
  }

  requestAnimationFrame(() => {
    element.classList.remove('form-error');
  });
  return true;
};

// Highlight multiple fields with errors and scroll to first
export const highlightErrors = (errorFieldIds: string[]) => {
  // Batch all classList.add operations in one rAF
  requestAnimationFrame(() => {
    errorFieldIds.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.classList.add('form-error');
      }
    });
  });

  // Scroll to first error
  if (errorFieldIds.length > 0) {
    scrollToFirstError(errorFieldIds);
  }
};
