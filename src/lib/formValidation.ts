// Form validation animation utilities
// Add shake animation for invalid form fields

// Shake animation trigger
export const triggerShake = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add('animate-shake', 'form-error');
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
