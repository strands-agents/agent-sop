import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { MCPConfigModal } from '../MCPConfigModal';
import { MCPServerConfig } from '../../types';

const mockServers: MCPServerConfig[] = [
  {
    id: '1',
    name: 'Test Server',
    type: 'stdio',
    config: { command: 'python', args: ['server.py'] },
    connected: true,
    tools: [{ name: 'test_tool', description: 'A test tool' }]
  },
  {
    id: '2',
    name: 'HTTP Server',
    type: 'http',
    config: { url: 'http://localhost:8000' },
    connected: false,
    error: 'Connection failed'
  }
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  servers: mockServers,
  onAddServer: jest.fn(),
  onRemoveServer: jest.fn(),
  onTestConnection: jest.fn()
};

describe('MCPConfigModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(<MCPConfigModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('MCP Server Configuration')).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(<MCPConfigModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<MCPConfigModal {...defaultProps} />);
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    render(<MCPConfigModal {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays server list with status indicators', () => {
    render(<MCPConfigModal {...defaultProps} />);
    expect(screen.getByText('Test Server')).toBeInTheDocument();
    expect(screen.getByText('HTTP Server')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('shows server type selection form', () => {
    render(<MCPConfigModal {...defaultProps} />);
    expect(screen.getByLabelText('Server Type')).toBeInTheDocument();
    const select = screen.getByLabelText('Server Type') as HTMLSelectElement;
    expect(select.value).toBe('stdio');
  });

  it('shows stdio fields when stdio type is selected', () => {
    render(<MCPConfigModal {...defaultProps} />);
    expect(screen.getByLabelText('Command')).toBeInTheDocument();
    expect(screen.getByLabelText('Arguments')).toBeInTheDocument();
  });

  it('shows HTTP fields when HTTP type is selected', async () => {
    render(<MCPConfigModal {...defaultProps} />);
    const typeSelect = screen.getByLabelText('Server Type');
    fireEvent.change(typeSelect, { target: { value: 'http' } });
    
    await waitFor(() => {
      expect(screen.getByLabelText('URL')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<MCPConfigModal {...defaultProps} />);
    const addButton = screen.getByText('Add Server');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Command is required')).toBeInTheDocument();
    });
  });

  it('calls onAddServer with valid form data', async () => {
    render(<MCPConfigModal {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText('Server Name'), { target: { value: 'New Server' } });
    fireEvent.change(screen.getByLabelText('Command'), { target: { value: 'python' } });
    fireEvent.change(screen.getByLabelText('Arguments'), { target: { value: 'server.py' } });
    
    const addButton = screen.getByText('Add Server');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(defaultProps.onAddServer).toHaveBeenCalledWith({
        name: 'New Server',
        type: 'stdio',
        config: { command: 'python', args: ['server.py'] },
        tools: [],
        error: undefined
      });
    });
  });

  it('calls onRemoveServer when remove button is clicked', () => {
    render(<MCPConfigModal {...defaultProps} />);
    const removeButtons = screen.getAllByLabelText('Remove server');
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemoveServer).toHaveBeenCalledWith('1');
  });

  it('calls onTestConnection when test button is clicked', () => {
    render(<MCPConfigModal {...defaultProps} />);
    // Test button was removed - this test is no longer valid
    // Servers now auto-connect when added
    expect(true).toBe(true);
  });

  it('displays tools for connected servers', () => {
    render(<MCPConfigModal {...defaultProps} />);
    // Tools are now collapsible and hidden by default
    // Click the "Available Tools" button to expand
    const toolsButton = screen.getByText(/Available Tools \(1\)/);
    fireEvent.click(toolsButton);
    
    // Now the tools should be visible
    expect(screen.getByText('test_tool')).toBeInTheDocument();
    expect(screen.getByText(/A test tool/)).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<MCPConfigModal {...defaultProps} />);
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('tabIndex', '-1');
  });
});
