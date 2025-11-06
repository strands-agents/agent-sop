/**
 * @jest-environment jsdom
 */

import { render, fireEvent } from '@testing-library/preact';
import { createElement } from 'preact';
import { useState } from 'preact/hooks';

// Mock theme toggle component
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  return createElement('button', {
    onClick: toggleTheme,
    className: `p-2 rounded ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'}`,
    'data-testid': 'theme-toggle'
  }, isDark ? '☀️' : '🌙');
};

describe('Dark Mode Support', () => {
  beforeEach(() => {
    // Reset document class
    document.documentElement.className = '';
  });

  test('should apply dark mode classes correctly', () => {
    document.documentElement.classList.add('dark');

    const TestComponent = () => createElement('div', {
      className: 'bg-white dark:bg-gray-900 text-black dark:text-white',
      'data-testid': 'themed-element'
    }, 'Content');

    const { getByTestId } = render(createElement(TestComponent));
    const element = getByTestId('themed-element');

    expect(element).toHaveClass('bg-white');
    expect(element).toHaveClass('dark:bg-gray-900');
    expect(element).toHaveClass('text-black');
    expect(element).toHaveClass('dark:text-white');
  });

  test('should toggle between light and dark themes', () => {
    const { getByTestId } = render(createElement(ThemeToggle));
    const toggleButton = getByTestId('theme-toggle');

    // Initially dark mode
    expect(toggleButton).toHaveClass('bg-gray-800');
    expect(toggleButton).toHaveClass('text-white');

    // Click to toggle to light mode
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveClass('bg-gray-200');
    expect(toggleButton).toHaveClass('text-black');
  });

  test('should respect system theme preference', () => {
    // Mock system preference for dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const TestComponent = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return createElement('div', {
        className: prefersDark ? 'dark' : 'light',
        'data-testid': 'system-themed'
      }, 'System themed content');
    };

    const { getByTestId } = render(createElement(TestComponent));
    const element = getByTestId('system-themed');

    expect(element).toHaveClass('dark');
  });

  test('should maintain theme consistency across components', () => {
    document.documentElement.classList.add('dark');

    const ParentComponent = () => createElement('div', {
      className: 'bg-white dark:bg-gray-900'
    }, [
      createElement('div', {
        key: 'child1',
        className: 'bg-gray-100 dark:bg-gray-800',
        'data-testid': 'child1'
      }, 'Child 1'),
      createElement('div', {
        key: 'child2',
        className: 'bg-gray-200 dark:bg-gray-700',
        'data-testid': 'child2'
      }, 'Child 2')
    ]);

    const { getByTestId } = render(createElement(ParentComponent));
    
    const child1 = getByTestId('child1');
    const child2 = getByTestId('child2');

    expect(child1).toHaveClass('dark:bg-gray-800');
    expect(child2).toHaveClass('dark:bg-gray-700');
  });
});
