/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/preact';
import { SplitLayout } from '../SplitLayout';

describe('SplitLayout', () => {
  const MockLeftPanel = () => <div data-testid="left-panel">Left Panel</div>;
  const MockRightPanel = () => <div data-testid="right-panel">Right Panel</div>;

  it('renders two panels side by side', () => {
    render(
      <SplitLayout
        leftPanel={<MockLeftPanel />}
        rightPanel={<MockRightPanel />}
      />
    );

    expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    expect(screen.getByTestId('right-panel')).toBeInTheDocument();
  });

  it('applies initial width correctly', () => {
    render(
      <SplitLayout
        leftPanel={<MockLeftPanel />}
        rightPanel={<MockRightPanel />}
        initialLeftWidth={60}
      />
    );

    const leftPanel = screen.getByTestId('left-panel').parentElement;
    expect(leftPanel).toHaveStyle('width: 60%');
  });

  it('renders divider between panels', () => {
    render(
      <SplitLayout
        leftPanel={<MockLeftPanel />}
        rightPanel={<MockRightPanel />}
      />
    );

    // Look for the divider by its Tailwind classes instead of old CSS class
    const divider = document.querySelector('.cursor-col-resize');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveClass('cursor-col-resize');
  });

  it('applies minimum panel width constraints', () => {
    render(
      <SplitLayout
        leftPanel={<MockLeftPanel />}
        rightPanel={<MockRightPanel />}
        minPanelWidth={30}
      />
    );

    const leftPanel = screen.getByTestId('left-panel').parentElement;
    const rightPanel = screen.getByTestId('right-panel').parentElement;
    
    expect(leftPanel).toHaveStyle('min-width: 30%');
    expect(rightPanel).toHaveStyle('min-width: 30%');
  });

  it('has proper responsive classes', () => {
    render(
      <SplitLayout
        leftPanel={<MockLeftPanel />}
        rightPanel={<MockRightPanel />}
      />
    );

    const container = screen.getByTestId('split-layout');
    expect(container).toHaveClass('flex', 'h-full', 'overflow-hidden');
    expect(container).toHaveClass('md:flex-row', 'flex-col');
  });
});
