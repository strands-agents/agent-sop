import { h } from 'preact';
import { ConnectionState } from '../types';
import { ErrorInfo } from '../services/ConnectionManager';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  lastError?: ErrorInfo | null;
  onReconnect?: () => void;
  className?: string;
}

export function ConnectionStatus({ 
  connectionState, 
  lastError, 
  onReconnect,
  className = '' 
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-gray-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connected': return '●';
      case 'connecting': return '◐';
      case 'disconnected': return '○';
      case 'error': return '✕';
      default: return '○';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  const showReconnectButton = connectionState === 'disconnected' || connectionState === 'error';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`${getStatusColor()} font-mono text-sm`}>
        {getStatusIcon()}
      </span>
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      
      {showReconnectButton && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reconnect
        </button>
      )}
      
      {lastError && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={lastError.message}>
          {lastError.message}
        </div>
      )}
    </div>
  );
}
