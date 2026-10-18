export function readStorage(getStorage, key) {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(getStorage, key, value) {
  try {
    getStorage()?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(getStorage, key) {
  try {
    getStorage()?.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readJsonStorage(getStorage, key) {
  const value = readStorage(getStorage, key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function resultEmptyMessage(totalProperties) {
  return totalProperties === 0
    ? "No homes have been synced to this private workspace yet."
    : "No homes match every selected evidence filter.";
}
