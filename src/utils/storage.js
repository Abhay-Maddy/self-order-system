// Safe LocalStorage wrapper with in-memory fallback to prevent SecurityError / DOMException crashes

const memoryStore = {};

export const safeStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`LocalStorage read failed for key "${key}", falling back to memory:`, e);
      return memoryStore[key] || null;
    }
  },

  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`LocalStorage write failed for key "${key}", falling back to memory:`, e);
      memoryStore[key] = String(value);
    }
  },

  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`LocalStorage remove failed for key "${key}", falling back to memory:`, e);
      delete memoryStore[key];
    }
  },

  clear: () => {
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn('LocalStorage clear failed, falling back to memory:', e);
      for (const key in memoryStore) {
        delete memoryStore[key];
      }
    }
  }
};

const sessionMemoryStore = {};

export const safeSessionStorage = {
  getItem: (key) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn(`SessionStorage read failed for key "${key}", falling back to memory:`, e);
      return sessionMemoryStore[key] || null;
    }
  },

  setItem: (key, value) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn(`SessionStorage write failed for key "${key}", falling back to memory:`, e);
      sessionMemoryStore[key] = String(value);
    }
  },

  removeItem: (key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`SessionStorage remove failed for key "${key}", falling back to memory:`, e);
      delete sessionMemoryStore[key];
    }
  },

  clear: () => {
    try {
      window.sessionStorage.clear();
    } catch (e) {
      console.warn('SessionStorage clear failed, falling back to memory:', e);
      for (const key in sessionMemoryStore) {
        delete sessionMemoryStore[key];
      }
    }
  }
};

