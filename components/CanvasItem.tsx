import React from 'react';
import { MoodboardItem } from '../types.ts';
import { X, Scaling, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';

interface CanvasItemProps {
  item: MoodboardItem;
  isActive: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onResizeStart: (e: React.PointerEvent, id: string) => void;
  onResizeDiscrete: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSetBackground: (content: string) => void;
}

export const CanvasItem: React.FC<CanvasItemProps> = ({
  item,
  isActive,
  onPointerDown,
  onResizeStart,
  onResizeDiscrete,
  onRemove,
  onBringToFront,
  onSetBackground
}) => {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onBringToFront(item.id);
    onPointerDown(e, item.id);
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onBringToFront(item.id);
    onResizeStart(e, item.id);
  };

  return (
    <div
      className={`absolute select-none ${isActive ? 'z-50' : ''}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        zIndex: item.zIndex,
        transform: `rotate(${item.rotation}deg)`,
        cursor: isActive ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className={`
          relative
          bg-[#FFF7D3]/50
          backdrop-blur-sm
          p-2
          rounded-sm
          transition-all
          duration-200
          ${isActive ? 'shadow-lg ring-1 ring-[#CE7200]/50' : 'hover:shadow-md'}
        `}
      >
        <img
          src={item.content}
          alt="Moodboard asset"
          className="w-full h-auto pointer-events-none block rounded-sm"
          style={{ objectFit: 'contain' }}
        />

        {isActive && (
          <div
            className="
              exclude-from-export
              absolute
              -bottom-12
              left-1/2
              -translate-x-1/2
              flex
              items-center
              gap-2
              bg-[#804100]/80
              backdrop-blur-sm
              p-1.5
              rounded-xl
              shadow-md
              border border-[#FDF9F5]/20
              z-[60]
            "
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onResizeDiscrete(item.id, -20); }}
              className="p-2 text-[#FFC682] hover:text-[#FDF9F5] hover:bg-[#FDF9F5]/10 rounded transition-colors"
              title="Verkleinern"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onResizeDiscrete(item.id, 20); }}
              className="p-2 text-[#FFC682] hover:text-[#FDF9F5] hover:bg-[#FDF9F5]/10 rounded transition-colors"
              title="Vergrößern"
            >
              <ZoomIn size={18} />
            </button>
            <div className="w-px h-4 bg-[#FDF9F5]/20 mx-1" />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onSetBackground(item.content); }}
              className="p-2 text-[#FFC682] hover:text-[#FDF9F5] hover:bg-[#FDF9F5]/10 rounded transition-colors"
              title="Als Hintergrund setzen"
            >
              <ImageIcon size={18} />
            </button>
            <div className="w-px h-4 bg-[#FDF9F5]/20 mx-1" />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
              className="p-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded transition-colors"
              title="Entfernen"
            >
              <X size={18} />
            </button>
            <div
              className="ml-1 cursor-nwse-resize text-[#CE7200] p-1 hover:text-[#FDF9F5]"
              onPointerDown={handleResizePointerDown}
              title="Größe ändern"
            >
              <Scaling size={14} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
