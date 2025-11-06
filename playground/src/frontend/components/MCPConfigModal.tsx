import { useState, useRef, useEffect } from 'preact/hooks';
import { MCPConfigModalProps, MCPServerConfig } from '../types';

export function MCPConfigModal({ 
  isOpen, 
  onClose, 
  servers, 
  onAddServer, 
  onRemoveServer, 
  onTestConnection 
}: MCPConfigModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'stdio' as 'stdio' | 'http',
    command: '',
    args: '',
    url: '',
    headers: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: Event) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({ name: '', type: 'stdio', command: '', args: '', url: '', headers: '' });
    setErrors({});
    setEditingServer(null);
    setExpandedTools(new Set());
    onClose();
  };

  const toggleToolsExpansion = (serverId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serverId)) {
        newSet.delete(serverId);
      } else {
        newSet.add(serverId);
      }
      return newSet;
    });
  };

  const handleEditServer = (server: MCPServerConfig) => {
    setEditingServer(server.id);
    setFormData({
      name: server.name,
      type: server.type,
      command: server.config.command || '',
      args: server.config.args ? server.config.args.join(', ') : '',
      url: server.config.url || '',
      headers: server.config.headers ? JSON.stringify(server.config.headers, null, 2) : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingServer(null);
    setFormData({ name: '', type: 'stdio', command: '', args: '', url: '', headers: '' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.type === 'stdio') {
      if (!formData.command.trim()) {
        newErrors.command = 'Command is required';
      }
    } else {
      if (!formData.url.trim()) {
        newErrors.url = 'URL is required';
      } else if (!/^https?:\/\/.+/.test(formData.url)) {
        newErrors.url = 'Invalid URL format';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddServer = () => {
    if (!validateForm()) return;
    
    const config = formData.type === 'stdio' 
      ? { 
          command: formData.command, 
          args: formData.args ? formData.args.split(',').map(arg => arg.trim()) : [] 
        }
      : { 
          url: formData.url,
          headers: formData.headers ? JSON.parse(formData.headers) : {}
        };
    
    if (editingServer) {
      // Update existing server
      onRemoveServer(editingServer);
      onAddServer({
        name: formData.name,
        type: formData.type,
        config,
        tools: [],
        error: undefined
      });
      setEditingServer(null);
    } else {
      // Add new server
      onAddServer({
        name: formData.name,
        type: formData.type,
        config,
        tools: [],
        error: undefined
      });
    }
    
    setFormData({ name: '', type: 'stdio', command: '', args: '', url: '', headers: '' });
    setErrors({});
  };

  const getStatusColor = (server: MCPServerConfig) => {
    if (server.error) return 'bg-red-500';
    if (server.connected) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getStatusText = (server: MCPServerConfig) => {
    if (server.error) return 'Error';
    if (server.connected) return 'Connected';
    return 'Disconnected';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 id="modal-title" className="text-xl font-semibold text-white">
            MCP Server Configuration
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Add/Edit Server Form */}
          <div className="w-1/2 p-4 border-r border-gray-700 overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-4">
              {editingServer ? 'Edit Server' : 'Add New Server'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="server-name" className="block text-sm font-medium text-gray-300 mb-2">
                  Server Name
                </label>
                <input
                  id="server-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My MCP Server"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="server-type" className="block text-sm font-medium text-gray-300 mb-2">
                  Server Type
                </label>
                <select
                  id="server-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: (e.target as HTMLSelectElement).value as 'stdio' | 'http' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="stdio">Stdio (Local)</option>
                  <option value="http">HTTP (Remote)</option>
                </select>
              </div>

              {formData.type === 'stdio' ? (
                <>
                  <div>
                    <label htmlFor="command" className="block text-sm font-medium text-gray-300 mb-2">
                      Command
                    </label>
                    <input
                      id="command"
                      type="text"
                      value={formData.command}
                      onChange={(e) => setFormData({ ...formData, command: (e.target as HTMLInputElement).value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="python"
                    />
                    {errors.command && <p className="text-red-400 text-sm mt-1">{errors.command}</p>}
                  </div>
                  <div>
                    <label htmlFor="args" className="block text-sm font-medium text-gray-300 mb-2">
                      Arguments
                    </label>
                    <input
                      id="args"
                      type="text"
                      value={formData.args}
                      onChange={(e) => setFormData({ ...formData, args: (e.target as HTMLInputElement).value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="server.py, --port, 8000"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
                      URL
                    </label>
                    <input
                      id="url"
                      type="text"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: (e.target as HTMLInputElement).value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="http://localhost:8000"
                    />
                    {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url}</p>}
                  </div>
                  <div>
                    <label htmlFor="headers" className="block text-sm font-medium text-gray-300 mb-2">
                      Headers (JSON)
                    </label>
                    <textarea
                      id="headers"
                      value={formData.headers}
                      onChange={(e) => setFormData({ ...formData, headers: (e.target as HTMLTextAreaElement).value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder='{"Authorization": "Bearer token"}'
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={handleAddServer}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  {editingServer ? 'Update Server' : 'Add Server'}
                </button>
                {editingServer && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Server List */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-4">Configured Servers</h3>
            
            {servers.length === 0 ? (
              <p className="text-gray-400">No servers configured</p>
            ) : (
              <div className="space-y-4">
                {servers.map((server) => (
                  <div key={server.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">{server.name}</h4>
                        <p className="text-gray-400 text-sm">{server.type}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(server)}`}>
                          {getStatusText(server)}
                        </span>
                        <button
                          onClick={() => handleEditServer(server)}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onRemoveServer(server.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          aria-label="Remove server"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {server.error && (
                      <p className="text-red-400 text-sm mb-2">{server.error}</p>
                    )}
                    
                    {server.connected && server.tools && server.tools.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleToolsExpansion(server.id)}
                          className="flex items-center justify-between w-full p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                        >
                          <span className="text-gray-300 text-sm font-medium">
                            Available Tools ({server.tools.length})
                          </span>
                          <svg 
                            className={`w-4 h-4 text-gray-300 transition-transform ${expandedTools.has(server.id) ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {expandedTools.has(server.id) && (
                          <div className="mt-2 p-3 bg-gray-600 rounded">
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {server.tools.map((tool, index) => (
                                <div key={index} className="text-sm">
                                  <span className="text-blue-400 font-mono">{tool.name}</span>
                                  {tool.description && (
                                    <span className="text-gray-300 ml-2">- {tool.description}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {server.connected && (!server.tools || server.tools.length === 0) && (
                      <div className="mt-3 p-3 bg-gray-600 rounded">
                        <p className="text-gray-400 text-sm">No tools available</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
