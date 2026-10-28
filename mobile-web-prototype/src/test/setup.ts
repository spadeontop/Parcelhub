import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock scrollTo for jsdom
window.scrollTo = () => {};
Element.prototype.scrollTo = () => {};

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});
