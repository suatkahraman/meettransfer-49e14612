export const safeLocalGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeLocalSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore (iOS Safari/PWA can block storage)
  }
};

export const safeLocalRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

export const safeSessionGet = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSessionSet = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

export const safeSessionRemove = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
};
