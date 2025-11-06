require('@testing-library/jest-dom');

// Mock scrollIntoView which is not available in JSDOM
Element.prototype.scrollIntoView = jest.fn();
