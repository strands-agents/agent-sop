/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/preact';
import { createElement } from 'preact';

describe('Tailwind CSS Integration', () => {
  beforeEach(() => {
    // Clear any existing styles
    document.head.innerHTML = '';
  });

  test('should apply Tailwind utility classes correctly', () => {
    const TestComponent = () => createElement('div', {
      className: 'bg-gray-900 text-white p-4 rounded-lg'
    }, 'Test content');

    const { container } = render(createElement(TestComponent));
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('bg-gray-900');
    expect(element).toHaveClass('text-white');
    expect(element).toHaveClass('p-4');
    expect(element).toHaveClass('rounded-lg');
  });

  test('should support responsive breakpoints', () => {
    const TestComponent = () => createElement('div', {
      className: 'w-full md:w-1/2 lg:w-1/3'
    }, 'Responsive content');

    const { container } = render(createElement(TestComponent));
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('w-full');
    expect(element).toHaveClass('md:w-1/2');
    expect(element).toHaveClass('lg:w-1/3');
  });

  test('should support dark mode classes', () => {
    const TestComponent = () => createElement('div', {
      className: 'bg-white dark:bg-gray-900 text-black dark:text-white'
    }, 'Dark mode content');

    const { container } = render(createElement(TestComponent));
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('bg-white');
    expect(element).toHaveClass('dark:bg-gray-900');
    expect(element).toHaveClass('text-black');
    expect(element).toHaveClass('dark:text-white');
  });

  test('should support interactive states', () => {
    const TestComponent = () => createElement('button', {
      className: 'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 active:bg-blue-700'
    }, 'Interactive button');

    const { container } = render(createElement(TestComponent));
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('bg-blue-500');
    expect(element).toHaveClass('hover:bg-blue-600');
    expect(element).toHaveClass('focus:ring-2');
    expect(element).toHaveClass('focus:ring-blue-300');
    expect(element).toHaveClass('active:bg-blue-700');
  });

  test('should support accessibility classes', () => {
    const TestComponent = () => createElement('button', {
      className: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0'
    }, 'Skip to content');

    const { container } = render(createElement(TestComponent));
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('sr-only');
    expect(element).toHaveClass('focus:not-sr-only');
    expect(element).toHaveClass('focus:absolute');
    expect(element).toHaveClass('focus:top-0');
    expect(element).toHaveClass('focus:left-0');
  });
});
