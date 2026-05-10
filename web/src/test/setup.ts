import '@testing-library/jest-dom/vitest'

// jsdom in vitest 2 ships an empty `localStorage` plain object — replace with
// a real Storage-like shim so tests that exercise localStorage behave naturally.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear() {
    this.store.clear()
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(i: number) {
    return [...this.store.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  writable: false,
  configurable: true,
})
