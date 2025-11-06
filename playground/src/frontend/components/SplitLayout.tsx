import { useState, useRef, useEffect } from 'preact/hooks';
import { ComponentChildren } from 'preact';

interface SplitLayoutProps {
  leftPanel: ComponentChildren;
  rightPanel: ComponentChildren;
  initialLeftWidth?: number;
  minPanelWidth?: number;
}

export function SplitLayout({ 
  leftPanel, 
  rightPanel, 
  initialLeftWidth = 50, 
  minPanelWidth = 20 
}: SplitLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Enforce minimum panel widths
    const clampedWidth = Math.max(minPanelWidth, Math.min(100 - minPanelWidth, newLeftWidth));
    setLeftWidth(clampedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      data-testid="split-layout"
      className="flex h-full overflow-hidden md:flex-row flex-col"
    >
      <div 
        className="overflow-hidden border-r border-gray-700 md:border-r md:border-b-0 border-b md:h-auto h-1/2"
        style={{
          width: `${leftWidth}%`,
          minWidth: `${minPanelWidth}%`
        }}
      >
        {leftPanel}
      </div>
      
      <div 
        className={`
          w-1 bg-gray-700 cursor-col-resize border-l border-r border-gray-700
          transition-colors duration-200 hover:bg-gray-600
          md:w-1 md:h-auto md:cursor-col-resize
          w-full h-1 cursor-row-resize
          ${isDragging ? 'bg-gray-600' : ''}
        `}
        onMouseDown={handleMouseDown}
      />
      
      <div 
        className="overflow-hidden md:h-auto h-1/2"
        style={{
          width: `${100 - leftWidth}%`,
          minWidth: `${minPanelWidth}%`
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
