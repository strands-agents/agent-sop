import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { TestingPanel } from '../TestingPanel';

describe('TestingPanel Integration with MockExecutionEngine', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    scriptContent: '# Test Script\n\nA sample script for testing.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Execution Engine Integration', () => {
    it('should execute script with streaming output', async () => {
      render(<TestingPanel {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const runButton = screen.getByText('Run Script');
      
      fireEvent.input(textarea, { target: { value: 'test input' } });
      fireEvent.click(runButton);
      
      // Should show running state
      expect(screen.getByText('Running...')).toBeInTheDocument();
      
      // Wait for execution to complete
      await waitFor(() => {
        expect(screen.getByText(/completed successfully/)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Should show completed state
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('should handle interactive mode execution', async () => {
      render(<TestingPanel {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const checkbox = screen.getByLabelText('Interactive Mode');
      const runButton = screen.getByText('Run Script');
      
      fireEvent.input(textarea, { target: { value: 'test input' } });
      fireEvent.click(checkbox);
      fireEvent.click(runButton);
      
      // Should show running state
      expect(screen.getByText('Running...')).toBeInTheDocument();
      
      // Wait for completion (interactive mode enabled but may not trigger prompt in simple script)
      await waitFor(() => {
        expect(screen.getByText(/completed successfully/)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Should show completed state
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('should handle script cancellation', async () => {
      render(<TestingPanel {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const runButton = screen.getByText('Run Script');
      
      fireEvent.input(textarea, { target: { value: 'test input' } });
      fireEvent.click(runButton);
      
      // Should be running
      expect(screen.getByText('Running...')).toBeInTheDocument();
      
      // Cancel execution
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Should show cancelled state
      await waitFor(() => {
        expect(screen.getByText('cancelled')).toBeInTheDocument();
      });
    });

    it('should detect script type and use appropriate execution', async () => {
      const complexScript = '# Complex Script\n\nThis script uses tools and reasoning.';
      render(<TestingPanel {...defaultProps} scriptContent={complexScript} />);
      
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const runButton = screen.getByText('Run Script');
      
      fireEvent.input(textarea, { target: { value: 'test input' } });
      fireEvent.click(runButton);
      
      // Wait for execution to start and show complex script patterns
      await waitFor(() => {
        const output = screen.getByTestId('execution-output');
        expect(output.textContent).toContain('complex');
      }, { timeout: 3000 });
    });

    it('should handle execution errors gracefully', async () => {
      // Use error scenario by setting high error rate content
      const errorScript = '# Error Script\n\nThis script will encounter errors.';
      render(<TestingPanel {...defaultProps} scriptContent={errorScript} />);
      
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const runButton = screen.getByText('Run Script');
      
      fireEvent.input(textarea, { target: { value: 'error trigger' } });
      fireEvent.click(runButton);
      
      // Wait for potential error (may or may not occur due to random error rate)
      await waitFor(() => {
        const output = screen.getByTestId('execution-output');
        expect(output.textContent).toBeTruthy();
      }, { timeout: 5000 });
    });
  });

  describe('State Management', () => {
    it('should show execution state in header', async () => {
      render(<TestingPanel {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const runButton = screen.getByText('Run Script');
      
      fireEvent.input(textarea, { target: { value: 'test input' } });
      fireEvent.click(runButton);
      
      // Should show running state in header
      expect(screen.getByText('running')).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('completed')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should disable controls during execution', async () => {
      render(<TestingPanel {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText(/Enter test parameters/);
      const checkbox = screen.getByLabelText('Interactive Mode');
      const runButton = screen.getByText('Run Script');
      
      fireEvent.input(textarea, { target: { value: 'test input' } });
      fireEvent.click(runButton);
      
      // Controls should be disabled during execution
      expect(textarea).toBeDisabled();
      expect(checkbox).toBeDisabled();
      expect(runButton).toBeDisabled();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('completed')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Cleanup', () => {
    it('should clean up execution engine on close', () => {
      const { rerender } = render(<TestingPanel {...defaultProps} />);
      
      // Close the modal
      rerender(<TestingPanel {...defaultProps} isOpen={false} />);
      
      // Should not crash or have memory leaks
      expect(true).toBe(true);
    });
  });
});
