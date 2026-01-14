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
    // Stop propagation to prevent triggering background click
    e.stopPropagation();
    
    // CRITICAL: Capture the pointer. This ensures the element keeps receiving events
    // even if the cursor moves outside of it during a fast drag.
    e.currentTarget.setPointerCapture(e.pointerId);
    
    onBringToFront(item.id);
    onPointerDown(e, item.id);
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    // Capture pointer for resize handle too
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
        touchAction: 'none', // Critical: Prevents scrolling on mobile while dragging
        // Removed will-change to prevent rendering issues
      }}
      onPointerDown={handlePointerDown}
    >
      {/* 
         Changed bg-white to bg-white/40 (Glass) 
         Added backdrop-blur to smooth out the background behind the image 
      */}
      <div className={`relative bg-white/40 backdrop-blur-md p-3 transition-all duration-200 rounded-sm ${isActive ? 'shadow-2xl ring-2 ring-violet-500/50' : 'hover:shadow-lg hover:bg-white/50'}`}>
        
        {/* Image Content */}
        <img
          src={item.content}
          alt="Moodboard asset"
          className="w-full h-auto pointer-events-none block shadow-sm opacity-95"
          style={{ objectFit: 'contain' }}
        />
        
        {/* Artistic Tape Effect */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/30 backdrop-blur-sm rotate-1 shadow-sm border border-white/20 pointer-events-none"></div>

        {/* 
            ACTIVE TOOLBAR
            Shows only when selected (isActive). 
            Replaces hover-only interaction for better accessibility and touch support.
        */}
        {isActive && (
          <div 
             className="exclude-from-export absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#2E1065] p-2 rounded-xl shadow-xl border border-white/20 z-[60]"
             onPointerDown={(e) => e.stopPropagation()} // Critical: Prevents tool interaction from triggering item drag
          >
            
            {/* Decrease Size */}
            <button
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => { e.stopPropagation(); onResizeDiscrete(item.id, -20); }}
               className="p-2 text-violet-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
               title="Verkleinern"
            >
              <ZoomOut size={18} />
            </button>

            {/* Increase Size */}
            <button
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => { e.stopPropagation(); onResizeDiscrete(item.id, 20); }}
               className="p-2 text-violet-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
               title="Vergrößern"
            >
              <ZoomIn size={18} />
            </button>

             <div className="w-px h-4 bg-white/20 mx-1"></div>

             {/* Set Background */}
            <button
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => { e.stopPropagation(); onSetBackground(item.content); }}
               className="p-2 text-violet-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
               title="Als Hintergrund setzen"
            >
              <ImageIcon size={18} />
            </button>

            <div className="w-px h-4 bg-white/20 mx-1"></div>

            {/* Remove */}
            <button
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
               className="p-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-lg transition-colors"
               title="Entfernen"
            >
              <X size={18} />
            </button>

            {/* Drag Handle for Mouse (Legacy) */}
            <div 
              className="ml-1 cursor-nwse-resize text-violet-400 p-1 hover:text-white"
              onPointerDown={handleResizePointerDown}
            >
               <Scaling size={14} />
            </div>

          </div>
        )}

      </div>
    </div>
  );
};