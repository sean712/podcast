import { useState, useEffect } from 'react';
import { FileText, Users, Clock, Tag, BookOpen, StickyNote, Sparkles } from 'lucide-react';
import ResizablePanel from './ResizablePanel';

export type TabType = 'overview' | 'moments' | 'people' | 'timeline' | 'references' | 'transcript' | 'notes';

interface PanelConfig {
  id: TabType;
  title: string;
  icon: React.ReactNode;
  minWidth: number;
  minHeight: number;
}

const PANEL_CONFIGS: Record<TabType, PanelConfig> = {
  overview: {
    id: 'overview',
    title: 'Overview',
    icon: <FileText className="w-4 h-4 text-cyan-400" />,
    minWidth: 400,
    minHeight: 300,
  },
  moments: {
    id: 'moments',
    title: 'Key Moments',
    icon: <Sparkles className="w-4 h-4 text-orange-400" />,
    minWidth: 400,
    minHeight: 350,
  },
  people: {
    id: 'people',
    title: 'People',
    icon: <Users className="w-4 h-4 text-emerald-400" />,
    minWidth: 400,
    minHeight: 300,
  },
  timeline: {
    id: 'timeline',
    title: 'Timeline',
    icon: <Clock className="w-4 h-4 text-purple-400" />,
    minWidth: 400,
    minHeight: 350,
  },
  references: {
    id: 'references',
    title: 'References',
    icon: <Tag className="w-4 h-4 text-cyan-400" />,
    minWidth: 400,
    minHeight: 300,
  },
  transcript: {
    id: 'transcript',
    title: 'Transcript',
    icon: <BookOpen className="w-4 h-4 text-blue-400" />,
    minWidth: 500,
    minHeight: 400,
  },
  notes: {
    id: 'notes',
    title: 'Notes',
    icon: <StickyNote className="w-4 h-4 text-yellow-400" />,
    minWidth: 400,
    minHeight: 350,
  },
};

interface OpenPanel {
  id: TabType;
  zIndex: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

interface DashboardManagerProps {
  children: (panelId: TabType) => React.ReactNode;
  openPanels: TabType[];
  onPanelClose: (panelId: TabType) => void;
}

export default function DashboardManager({ children, openPanels, onPanelClose }: DashboardManagerProps) {
  const [panels, setPanels] = useState<OpenPanel[]>([]);
  const [focusedPanelId, setFocusedPanelId] = useState<TabType | null>(null);
  const [baseZIndex] = useState(1000);

  useEffect(() => {
    const currentPanelIds = new Set(panels.map(p => p.id));
    const newPanelIds = openPanels.filter(id => !currentPanelIds.has(id));
    const removedPanelIds = panels.filter(p => !openPanels.includes(p.id)).map(p => p.id);

    if (newPanelIds.length > 0 || removedPanelIds.length > 0) {
      setPanels(prev => {
        let updated = prev.filter(p => openPanels.includes(p.id));

        const maxZ = updated.length > 0 ? Math.max(...updated.map(p => p.zIndex)) : baseZIndex;

        newPanelIds.forEach((id, index) => {
          const offset = (panels.length + index) * 30;
          updated.push({
            id,
            zIndex: maxZ + index + 1,
            position: { x: 120 + offset, y: 120 + offset },
            size: getDefaultSize(id),
          });
        });

        return updated;
      });

      if (newPanelIds.length > 0) {
        setFocusedPanelId(newPanelIds[newPanelIds.length - 1]);
      }
    }
  }, [openPanels]);

  const getDefaultSize = (panelId: TabType): { width: number; height: number } => {
    const config = PANEL_CONFIGS[panelId];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let width = 560;
    let height = 600;

    if (panelId === 'transcript') {
      width = Math.min(700, viewportWidth - 240);
      height = Math.min(700, viewportHeight - 300);
    } else if (panelId === 'timeline') {
      height = Math.min(650, viewportHeight - 300);
    }

    return {
      width: Math.max(config.minWidth, width),
      height: Math.max(config.minHeight, height),
    };
  };

  const handlePanelFocus = (panelId: TabType) => {
    setFocusedPanelId(panelId);
    setPanels(prev => {
      const maxZ = Math.max(...prev.map(p => p.zIndex));
      return prev.map(p =>
        p.id === panelId ? { ...p, zIndex: maxZ + 1 } : p
      );
    });
  };

  const handlePanelClose = (panelId: TabType) => {
    onPanelClose(panelId);
    setPanels(prev => prev.filter(p => p.id !== panelId));
    if (focusedPanelId === panelId) {
      const remaining = panels.filter(p => p.id !== panelId);
      if (remaining.length > 0) {
        const highest = remaining.reduce((max, p) => p.zIndex > max.zIndex ? p : max);
        setFocusedPanelId(highest.id);
      } else {
        setFocusedPanelId(null);
      }
    }
  };

  return (
    <>
      {panels.map(panel => {
        const config = PANEL_CONFIGS[panel.id];
        return (
          <ResizablePanel
            key={panel.id}
            id={panel.id}
            title={config.title}
            icon={config.icon}
            onClose={() => handlePanelClose(panel.id)}
            initialPosition={panel.position}
            initialSize={panel.size}
            minWidth={config.minWidth}
            minHeight={config.minHeight}
            zIndex={panel.zIndex}
            onFocus={() => handlePanelFocus(panel.id)}
            isFocused={focusedPanelId === panel.id}
          >
            {children(panel.id)}
          </ResizablePanel>
        );
      })}
    </>
  );
}
