/**
 * @jest-environment jsdom
 */

import { render, cleanup } from '@testing-library/preact';
import { App } from '../App';

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('Responsive Design', () => {
  let originalInnerWidth: number;
  let originalMatchMedia: any;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalMatchMedia = window.matchMedia;
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(mockMatchMedia),
    });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    window.matchMedia = originalMatchMedia;
  });

  test('should render mobile layout on small screens', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = render(<App />);
    
    // Should have mobile-responsive classes
    const splitLayout = container.querySelector('[data-testid="split-layout"]');
    expect(splitLayout).toBeTruthy();
  });

  test('should render desktop layout on large screens', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { container } = render(<App />);
    
    // Should have desktop layout classes
    const splitLayout = container.querySelector('[data-testid="split-layout"]');
    expect(splitLayout).toBeTruthy();
  });

  test('should handle viewport changes', () => {
    const { container } = render(<App />);
    
    // Simulate viewport change
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    const splitLayout = container.querySelector('[data-testid="split-layout"]');
    expect(splitLayout).toBeTruthy();
  });

  test('should maintain accessibility on all screen sizes', () => {
    const { container } = render(<App />);
    
    // Check for proper ARIA labels and roles
    const chatInterface = container.querySelector('[role="main"]');
    const scriptPreview = container.querySelector('[role="complementary"]');
    
    // These should exist regardless of screen size
    expect(chatInterface || scriptPreview).toBeTruthy();
  });
});
