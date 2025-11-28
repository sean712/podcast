import { useState, useRef, useEffect } from 'react';
import { X, Minus, Maximize2, Minimize2, GripHorizontal } from 'lucide-react';

interface ResizablePanelProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  zIndex: number;
  onFocus: () => void;
  isFocused: boolean;
}

export default function ResizablePanel({
  id,
  title,
  icon,
  children,
  onClose,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 560, height: 600 },
  minWidth = 400,
  minHeight = 300,
  zIndex,
  onFocus,
  isFocused,
}: ResizablePanelProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');

  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const savedState = useRef({ position: initialPosition, size: initialSize });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        setPosition(prev => {
          const newX = Math.max(0, Math.min(prev.x + deltaX, window.innerWidth - 100));
          const newY = Math.max(0, Math.min(prev.y + deltaY, window.innerHeight - 100));
          return { x: newX, y: newY };
        });

        dragStartPos.current = { x: e.clientX, y: e.clientY };
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;

        setSize(prev => {
          let newWidth = prev.width;
          let newHeight = prev.height;
          let newX = position.x;
          let newY = position.y;

          if (resizeDirection.includes('e')) {
            newWidth = Math.max(minWidth, resizeStartSize.current.width + deltaX);
          }
          if (resizeDirection.includes('w')) {
            const widthDelta = resizeStartSize.current.width - deltaX;
            if (widthDelta >= minWidth) {
              newWidth = widthDelta;
              newX = position.x + deltaX;
              setPosition(prev => ({ ...prev, x: newX }));
            }
          }
          if (resizeDirection.includes('s')) {
            newHeight = Math.max(minHeight, resizeStartSize.current.height + deltaY);
          }
          if (resizeDirection.includes('n')) {
            const heightDelta = resizeStartSize.current.height - deltaY;
            if (heightDelta >= minHeight) {
              newHeight = heightDelta;
              newY = position.y + deltaY;
              setPosition(prev => ({ ...prev, y: newY }));
            }
          }

          return { width: newWidth, height: newHeight };
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, position, minWidth, minHeight, resizeDirection]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    onFocus();
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = { ...size };
  };

  const handleMaximize = () => {
    if (isMaximized) {
      setPosition(savedState.current.position);
      setSize(savedState.current.size);
      setIsMaximized(false);
    } else {
      savedState.current = { position, size };
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 180 });
      setIsMaximized(true);
    }
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handlePanelClick = () => {
    onFocus();
  };

  return (
    <div
      ref={panelRef}
      className={`fixed rounded-2xl bg-slate-900/95 backdrop-blur-xl border shadow-2xl overflow-hidden transition-all duration-200 resizable-panel panel-enter ${
        isFocused ? 'border-cyan-400/60 ring-2 ring-cyan-400/20' : 'border-slate-700/60'
      } ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 'auto' : size.height,
        zIndex,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onClick={handlePanelClick}
    >
      {/* Resize Handles */}
      {!isMaximized && !isMinimized && (
        <>
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          <div
            className="absolute top-0 left-3 right-3 h-1 cursor-n-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div
            className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div
            className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div
            className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize z-50"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
        </>
      )}

      {/* Header */}
      <div
        className={`px-4 py-3 border-b border-slate-700/60 flex items-center justify-between ${
          !isMaximized ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-semibold text-slate-100">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4 text-slate-300" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4 text-slate-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-300" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="overflow-y-auto" style={{ height: `calc(${size.height}px - 52px)` }}>
          <div className="p-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
