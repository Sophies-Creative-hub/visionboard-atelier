import React from 'react';
import { MoodboardItem } from '../types.ts';
import { X, Scaling, Image as ImageIcon } from 'lucide-react';

interface CanvasItemProps {
  item: MoodboardItem;
  isActive: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeStart: (e: React.MouseEvent, id: string) => void;
  onRemove: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSetBackground: (content: string) => void;
}

export const CanvasItem: React.FC<CanvasItemProps> = ({
  item,
  isActive,
  onMouseDown,
  onResizeStart,
  onRemove,
  onBringToFront,
  onSetBackground
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBringToFront(item.id);
    onMouseDown(e, item.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBringToFront(item.id);
    onResizeStart(e, item.id);
  };

  return (
    <div
      className={`absolute group select-none ${isActive ? 'z-50' : ''}`}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        zIndex: item.zIndex,
        transform: `rotate(${item.rotation}deg)`,
        cursor: isActive ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 
         Changed bg-white to bg-white/40 (Glass) 
         Added backdrop-blur to smooth out the background behind the image 
      */}
      <div className={`relative bg-white/40 backdrop-blur-md p-3 transition-all duration-200 rounded-sm ${isActive ? 'shadow-2xl ring-1 ring-white/50' : 'hover:shadow-lg hover:bg-white/50'}`}>
        
        {/* Image Content */}
        <img
          src={item.content}
          alt="Moodboard asset"
          className="w-full h-auto pointer-events-none block shadow-sm opacity-95"
          style={{ objectFit: 'contain' }}
        />

        {/* Hover Controls - Dark buttons with light text */}
        <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-50">
           <button
            onClick={(e) => { e.stopPropagation(); onSetBackground(item.content); }}
            className="bg-[#2E1065] text-violet-200 p-1.5 rounded-full shadow-lg hover:bg-[#4C1D95] hover:text-white transition-colors border border-white/20"
            title="Set as Background"
          >
            <ImageIcon size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            className="bg-[#2E1065] text-red-300 p-1.5 rounded-full shadow-lg hover:bg-red-900/80 hover:text-red-100 transition-colors border border-white/20"
            title="Remove Item"
          >
            <X size={14} />
          </button>
        </div>

        {/* Resize Handle - Dark button */}
        <div 
          className="absolute -bottom-3 -right-3 opacity-0 group-hover:opacity-100 cursor-nwse-resize p-1.5 bg-[#2E1065] text-violet-200 rounded-full shadow-lg border border-white/20 z-50 hover:text-white hover:bg-[#4C1D95]"
          onMouseDown={handleResizeMouseDown}
        >
          <Scaling size={14} />
        </div>
        
        {/* Artistic Tape Effect - More subtle/translucent */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/30 backdrop-blur-sm rotate-1 shadow-sm border border-white/20 pointer-events-none"></div>
      </div>
    </div>
  );
};