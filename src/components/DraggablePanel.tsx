import { ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { X, Minimize2, Maximize2 } from 'lucide-react';

interface DraggablePanelProps {
  id: string;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  icon?: ReactNode;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function DraggablePanel({
  id,
  title,
  children,
  onClose,
  onFocus,
  zIndex,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 560, height: 600 },
  minWidth = 320,
  minHeight = 200,
  icon,
  isMinimized = false,
  onToggleMinimize,
}: DraggablePanelProps) {
  const handleMouseDown = () => {
    onFocus();
  };

  return (
    <Rnd
      default={{
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: defaultSize.width,
        height: isMinimized ? 48 : defaultSize.height,
      }}
      minWidth={minWidth}
      minHeight={isMinimized ? 48 : minHeight}
      bounds="parent"
      dragHandleClassName="drag-handle"
      style={{ zIndex }}
      onMouseDown={handleMouseDown}
      enableResizing={!isMinimized}
      disableDragging={false}
    >
      <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-lg border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        <div className="drag-handle flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 cursor-move">
          <div className="flex items-center gap-2">
            {icon && <span className="text-cyan-400">{icon}</span>}
            <h3 className="text-sm font-semibold text-white select-none">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1.5 hover:bg-slate-700/60 rounded transition-colors text-slate-300 hover:text-white"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-slate-300 hover:text-red-400"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>
        )}
      </div>
    </Rnd>
  );
}
