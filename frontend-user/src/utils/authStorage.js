const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const STORAGE_MODE_KEY = 'auth_storage_mode';
const STORAGE_TEST_KEY = '__auth_storage_probe__';

const resolveStorage = (type) => {
  const root =
    typeof window !== 'undefined'
      ? window
      : typeof globalThis !== 'undefined'
        ? globalThis
        : undefined;

  if (!root || !root[type]) {
    return null;
  }

  try {
    root[type].setItem(STORAGE_TEST_KEY, '1');
    root[type].removeItem(STORAGE_TEST_KEY);
    return root[type];
  } catch (error) {
    console.warn(`Storage "${type}" is not available`, error);
    return null;
  }
};

const localStore = resolveStorage('localStorage');
const sessionStore = resolveStorage('sessionStorage');

const getPrimaryStorage = (mode) => {
  if (mode === 'session') {
    return sessionStore || localStore;
  }
  return localStore || sessionStore;
};

const getSecondaryStorage = (mode) => {
  if (mode === 'session') {
    return localStore;
  }
  return sessionStore;
};

export const authStorage = {
  persist({ token, user, remember = true }) {
    const mode = remember ? 'local' : 'session';
    const primary = getPrimaryStorage(mode);

    if (!primary || !token || !user) {
      return false;
    }

    primary.setItem(TOKEN_KEY, token);
    primary.setItem(USER_KEY, JSON.stringify(user));
    primary.setItem(STORAGE_MODE_KEY, mode);

    const secondary = getSecondaryStorage(mode);
    if (secondary) {
      secondary.removeItem(TOKEN_KEY);
      secondary.removeItem(USER_KEY);
      secondary.removeItem(STORAGE_MODE_KEY);
    }

    return true;
  },

  updateUser(user) {
    if (!user) return false;
    const storage = getPrimaryStorage(this.getStorageMode());
    if (!storage) return false;

    storage.setItem(USER_KEY, JSON.stringify(user));
    return true;
  },

  getToken() {
    return (
      sessionStore?.getItem(TOKEN_KEY) ||
      localStore?.getItem(TOKEN_KEY) ||
      null
    );
  },

  getUser() {
    const raw =
      sessionStore?.getItem(USER_KEY) || localStore?.getItem(USER_KEY);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Unable to parse stored user payload', error);
      return null;
    }
  },

  getStorageMode() {
    return (
      sessionStore?.getItem(STORAGE_MODE_KEY) ||
      localStore?.getItem(STORAGE_MODE_KEY) ||
      'local'
    );
  },

  clear() {
    if (localStore) {
      localStore.removeItem(TOKEN_KEY);
      localStore.removeItem(USER_KEY);
      localStore.removeItem(STORAGE_MODE_KEY);
    }

    if (sessionStore) {
      sessionStore.removeItem(TOKEN_KEY);
      sessionStore.removeItem(USER_KEY);
      sessionStore.removeItem(STORAGE_MODE_KEY);
    }
  }
};

