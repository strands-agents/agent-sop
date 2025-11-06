/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/preact';
import { ScriptPreview } from '../ScriptPreview';

// Mock URL.createObjectURL and related APIs
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ScriptPreview', () => {
  const mockMarkdownContent = `# Test Script

## Overview
This is a test script.

## Parameters
- **input** (required): Test input

## Steps

### 1. Process
Execute the logic.

**Constraints:**
- You MUST validate inputs
- You SHOULD log progress

\`\`\`javascript
console.log('Hello World');
\`\`\`

**Bold text** and *italic text* example.`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders markdown content correctly', () => {
    render(<ScriptPreview content={mockMarkdownContent} />);

    expect(screen.getAllByText('Test Script')).toHaveLength(2); // Button and heading
    expect(screen.getByText(/This is a test script/)).toBeInTheDocument();
    expect(screen.getByText(/Execute the logic/)).toBeInTheDocument();
  });

  it('shows empty state when no content', () => {
    render(<ScriptPreview content="" />);

    expect(screen.getByText(/Your agent script will appear here/)).toBeInTheDocument();
    expect(screen.getByText(/Start chatting with the agent/)).toBeInTheDocument();
  });

  it('shows export button when content exists', () => {
    render(<ScriptPreview content={mockMarkdownContent} />);

    const exportButton = screen.getByText('Export');
    expect(exportButton).toBeInTheDocument();
  });

  it('hides export button when no content', () => {
    render(<ScriptPreview content="" />);

    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });


});
