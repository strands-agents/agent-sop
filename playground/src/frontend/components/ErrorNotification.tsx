import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ErrorInfo } from '../services/ConnectionManager';

interface ErrorNotificationProps {
  error: ErrorInfo | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  autoHideDelay?: number;
}

export function ErrorNotification({ 
  error, 
  onDismiss, 
  onRetry,
  autoHideDelay = 5000 
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onDismiss?.(), 300); // Wait for fade out
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHideDelay, onDismiss]);

  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network': return '🌐';
      case 'service': return '⚙️';
      case 'timeout': return '⏱️';
      case 'protocol': return '⚠️';
      default: return '❌';
    }
  };

  const getErrorColor = () => {
    return error.recoverable ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
  };

  const getTextColor = () => {
    return error.recoverable ? 'text-yellow-800' : 'text-red-800';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
    }`}>
      <div className={`max-w-sm p-4 rounded-lg border shadow-lg ${getErrorColor()}`}>
        <div className="flex items-start space-x-3">
          <span className="text-lg flex-shrink-0">
            {getErrorIcon()}
          </span>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${getTextColor()}`}>
              Connection {error.recoverable ? 'Issue' : 'Error'}
            </h4>
            
            <p className={`text-sm mt-1 ${getTextColor()}`}>
              {error.message}
            </p>
            
            {error.suggestion && (
              <p className={`text-xs mt-2 ${getTextColor()} opacity-75`}>
                {error.suggestion}
              </p>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onDismiss?.(), 300);
            }}
            className={`flex-shrink-0 ${getTextColor()} hover:opacity-75`}
          >
            ✕
          </button>
        </div>
        
        {error.recoverable && onRetry && (
          <div className="mt-3 flex space-x-2">
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry Connection
            </button>
            
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss?.(), 300);
              }}
              className={`text-xs px-3 py-1 border rounded hover:bg-gray-50 transition-colors ${getTextColor()}`}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
