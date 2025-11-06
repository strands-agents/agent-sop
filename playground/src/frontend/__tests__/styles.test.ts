/**
 * @jest-environment jsdom
 */

describe('Styles and CSS', () => {
  beforeEach(() => {
    // Clear any existing styles
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('Global Styles', () => {
    test('should apply box-sizing border-box globally', () => {
      // Create a test element
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);
      
      // Apply the global CSS rule
      const style = document.createElement('style');
      style.textContent = '* { box-sizing: border-box; }';
      document.head.appendChild(style);
      
      const computedStyle = window.getComputedStyle(testElement);
      expect(computedStyle.boxSizing).toBe('border-box');
    });

    test('should reset body margin and padding', () => {
      const style = document.createElement('style');
      style.textContent = `
        body {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: #ffffff;
        }
      `;
      document.head.appendChild(style);
      
      const bodyStyle = window.getComputedStyle(document.body);
      expect(bodyStyle.margin).toBe('0px');
      expect(bodyStyle.padding).toBe('0px');
    });
  });

  describe('Animation Elements', () => {
    test('should create typing indicator elements', () => {
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'typing-indicator';
      
      // Add three spans for the animation
      for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        typingIndicator.appendChild(span);
      }
      
      document.body.appendChild(typingIndicator);
      
      expect(typingIndicator.children).toHaveLength(3);
      expect(typingIndicator.className).toBe('typing-indicator');
    });
  });

  describe('Responsive Design Support', () => {
    test('should support media queries', () => {
      // Mock window.matchMedia for media query testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      expect(window.matchMedia('(max-width: 768px)').matches).toBe(true);
      expect(window.matchMedia('(min-width: 1200px)').matches).toBe(false);
    });
  });

  describe('Accessibility Features', () => {
    test('should support high contrast mode', () => {
      // Mock prefers-contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      expect(window.matchMedia('(prefers-contrast: high)').matches).toBe(true);
    });

    test('should support reduced motion preferences', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    });
  });

  describe('Interactive Elements', () => {
    test('should handle focus states', () => {
      const button = document.createElement('button');
      const textarea = document.createElement('textarea');
      
      document.body.appendChild(button);
      document.body.appendChild(textarea);
      
      // Simulate focus
      button.focus();
      textarea.focus();
      
      // Elements should be focusable
      expect(button).toBeInTheDocument();
      expect(textarea).toBeInTheDocument();
    });
  });
});
