// src/test/setup.js — Vitest global setup
import '@testing-library/jest-dom';

// Stub window.location so tests that call window.location.href = '/login'
// don't throw in jsdom
delete window.location;
window.location = { href: '', assign: vi.fn(), replace: vi.fn() };

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Reset all mocks and localStorage between tests
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  localStorageMock.getItem.mockImplementation((key) => null);
});

// Silence noisy console output in tests (comment out to debug)
vi.spyOn(console, 'error').mockImplementation(() => {});
