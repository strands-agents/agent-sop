import { render, screen, fireEvent } from '@testing-library/preact';
import { TestingPanel } from '../TestingPanel';

describe('TestingPanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    scriptContent: '# Test Script\n\nA sample script for testing.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Integration', () => {
    it('renders modal when isOpen is true', () => {
      render(<TestingPanel {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Agent Script')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<TestingPanel {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
      render(<TestingPanel {...defaultProps} />);
      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', () => {
      render(<TestingPanel {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when ESC key is pressed', () => {
      render(<TestingPanel {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Functionality', () => {
    it('renders parameter input textarea', () => {
      render(<TestingPanel {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      expect(textarea).toBeInTheDocument();
    });

    it('updates parameter input value', () => {
      render(<TestingPanel {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/Enter test parameters/) as HTMLTextAreaElement;
      fireEvent.input(textarea, { target: { value: 'test input' } });
      expect(textarea.value).toBe('test input');
    });

    it('renders interactive mode checkbox', () => {
      render(<TestingPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText('Interactive Mode');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('toggles interactive mode checkbox', () => {
      render(<TestingPanel {...defaultProps} />);
      const checkbox = screen.getByLabelText('Interactive Mode') as HTMLInputElement;
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('renders Run Script and Cancel buttons', () => {
      render(<TestingPanel {...defaultProps} />);
      expect(screen.getByText('Run Script')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('enables Run Script button when input is provided', async () => {
      render(<TestingPanel {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const runButton = screen.getByText('Run Script');
      
      // Initially disabled
      expect(runButton).toBeDisabled();
      
      // Should be enabled after input
      fireEvent.input(textarea, { target: { value: 'test input' } });
      expect(runButton).not.toBeDisabled();
    });

    it('shows loading state during execution', async () => {
      render(<TestingPanel {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const runButton = screen.getByText('Run Script');
      
      fireEvent.input(textarea, { target: { value: 'test input' } });
      fireEvent.click(runButton);
      
      expect(screen.getByText('Running...')).toBeInTheDocument();
    });
  });

  describe('Output Display', () => {
    it('renders output area', () => {
      render(<TestingPanel {...defaultProps} />);
      expect(screen.getByTestId('execution-output')).toBeInTheDocument();
    });

    it('shows placeholder text when no output', () => {
      render(<TestingPanel {...defaultProps} />);
      expect(screen.getByText(/Execution output will appear here/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<TestingPanel {...defaultProps} />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('focuses modal content when opened', () => {
      render(<TestingPanel {...defaultProps} />);
      const modal = screen.getByRole('dialog');
      expect(document.activeElement).toBe(modal);
    });
  });
});
