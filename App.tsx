import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Grid3x3, RotateCcw, X, Maximize2, ArrowUp } from 'lucide-react';

// Types
interface MoodboardItem {
  id: string;
  type: 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  zIndex: number;
  rotation: number;
}

interface DragState {
  isDragging: boolean;
  mode: 'move' | 'resize';
  itemId: string | null;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
  originalWidth: number;
}

// Canvas Item Component
const CanvasItem: React.FC<{
  item: MoodboardItem;
  isActive: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onResizeStart: (e: React.PointerEvent, id: string) => void;
  onResizeDiscrete: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSetBackground: (content: string) => void;
}> = ({ item, isActive, onPointerDown, onResizeStart, onResizeDiscrete, onRemove, onBringToFront, onSetBackground }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.width,
        zIndex: item.zIndex,
        transform: `rotate(${item.rotation}deg)`,
        cursor: 'move',
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onBringToFront(item.id);
        onPointerDown(e, item.id);
      }}
      className="group"
    >
      <img
        src={item.content}
        alt="Moodboard item"
        draggable={false}
        className="w-full h-full object-cover rounded-sm shadow-lg select-none pointer-events-none"
        style={{
          boxShadow: isActive 
            ? '0 0 0 3px rgba(139, 92, 246, 0.5), 0 20px 25px -5px rgba(0, 0, 0, 0.3)' 
            : '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
        }}
      />
      
      {isActive && (
        <>
          {/* Toolbar */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#1e1b4b]/95 backdrop-blur-sm px-3 py-2 rounded-full shadow-xl border border-white/10 flex items-center gap-2 pointer-events-auto z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResizeDiscrete(item.id, -30);
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-violet-200 hover:text-white text-lg font-bold leading-none"
              title="Kleiner"
            >
              −
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResizeDiscrete(item.id, 30);
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-violet-200 hover:text-white text-lg font-bold leading-none"
              title="Größer"
            >
              +
            </button>
            
            <div className="w-px h-4 bg-white/20"></div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetBackground(item.content);
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-violet-200 hover:text-white"
              title="Als Hintergrund"
            >
              <ArrowUp size={14} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="p-1.5 hover:bg-red-500/20 rounded-full transition-colors text-red-300 hover:text-red-200"
              title="Löschen"
            >
              <X size={14} />
            </button>
          </div>

          {/* Resize Handle */}
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, item.id);
            }}
            className="absolute -right-3 -bottom-3 w-6 h-6 bg-violet-500 rounded-full cursor-nwse-resize shadow-lg border-2 border-white pointer-events-auto z-50"
            style={{ touchAction: 'none' }}
          />
        </>
      )}
    </div>
  );
};

// Main App
const generateId = () => Math.random().toString(36).substr(2, 9);
const getRandomRotation = () => Math.random() * 6 - 3;
const GRID_SIZE = 40;

const App: React.FC = () => {
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    mode: 'move',
    itemId: null,
    startX: 0,
    startY: 0,
    originalX: 0,
    originalY: 0,
    originalWidth: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const item = items.find(i => i.id === id);
    if (!item) return;

    setDragState({
      isDragging: true,
      mode: 'move',
      itemId: id,
      startX: e.clientX,
      startY: e.clientY,
      originalX: item.x,
      originalY: item.y,
      originalWidth: item.width,
    });
  }, [items]);

  const handleResizeStart = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const item = items.find(i => i.id === id);
    if (!item) return;

    setDragState({
      isDragging: true,
      mode: 'resize',
      itemId: id,
      startX: e.clientX,
      startY: e.clientY,
      originalX: item.x,
      originalY: item.y,
      originalWidth: item.width,
    });
  }, [items]);

  const handleDiscreteResize = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newWidth = Math.max(50, item.width + delta);
        return { ...item, width: newWidth };
      }
      return item;
    }));
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.isDragging || !dragState.itemId) return;
    e.preventDefault();

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    setItems(prev => prev.map(item => {
      if (item.id === dragState.itemId) {
        if (dragState.mode === 'move') {
          let newX = dragState.originalX + deltaX;
          let newY = dragState.originalY + deltaY;

          if (showGrid) {
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
          }

          return { ...item, x: newX, y: newY };
        } else if (dragState.mode === 'resize') {
          let newWidth = Math.max(50, dragState.originalWidth + deltaX);
          
          if (showGrid) {
            newWidth = Math.round(newWidth / (GRID_SIZE / 2)) * (GRID_SIZE / 2);
          }

          return { ...item, width: newWidth };
        }
      }
      return item;
    }));
  }, [dragState, showGrid]);

  const handlePointerUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, isDragging: false }));
    }
  }, [dragState]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState.isDragging, handlePointerMove, handlePointerUp]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addItem(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addItem = (content: string) => {
    let containerWidth = window.innerWidth;
    let containerHeight = window.innerHeight;

    if (containerRef.current) {
      if (containerRef.current.offsetWidth > 0) {
        containerWidth = containerRef.current.offsetWidth;
        containerHeight = containerRef.current.offsetHeight;
      } else if (containerRef.current.clientWidth > 0) {
        containerWidth = containerRef.current.clientWidth;
        containerHeight = containerRef.current.clientHeight;
      }
    }
    
    if (containerWidth < 300) containerWidth = window.innerWidth;
    if (containerHeight < 300) containerHeight = window.innerHeight;

    let startX = (containerWidth / 2) - 125 + (Math.random() * 60 - 30);
    let startY = (containerHeight / 2) - 125 + (Math.random() * 60 - 30);

    if (startX < 0) startX = 20;
    if (startY < 0) startY = 80;

    if (showGrid) {
      startX = Math.round(startX / GRID_SIZE) * GRID_SIZE;
      startY = Math.round(startY / GRID_SIZE) * GRID_SIZE;
    }

    const newItem: MoodboardItem = {
      id: generateId(),
      type: 'image',
      content,
      x: startX,
      y: startY,
      width: 250,
      zIndex: items.length + 10,
      rotation: showGrid ? 0 : getRandomRotation(),
    };

    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const bringToFront = (id: string) => {
    setItems(prev => {
      const maxZ = Math.max(...prev.map(i => i.zIndex), 10);
      return prev.map(item => 
        item.id === id ? { ...item, zIndex: maxZ + 1 } : item
      );
    });
  };

  const handleSetBackground = (content: string) => {
    setBackgroundImage(content);
  };

  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);

    try {
      // Draw background
      if (backgroundImage) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
          bgImg.src = backgroundImage;
          setTimeout(reject, 5000);
        });
        
        // Calculate cover sizing (like CSS object-fit: cover)
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = width / height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgRatio > canvasRatio) {
          // Image is wider than canvas
          drawHeight = height;
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller than canvas
          drawWidth = width;
          drawHeight = width / imgRatio;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        }
        
        ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        gradient.addColorStop(0, '#E9D5FF');
        gradient.addColorStop(1, '#C4B5FD');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw items
      const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);
      
      for (const item of sortedItems) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = item.content;
          setTimeout(reject, 5000);
        });

        ctx.save();
        
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.width / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        
        // Calculate cover sizing for item
        const imgRatio = img.width / img.height;
        const itemSize = item.width;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgRatio > 1) {
          // Image is wider - fit to height
          drawHeight = itemSize;
          drawWidth = itemSize * imgRatio;
          offsetX = item.x - (drawWidth - itemSize) / 2;
          offsetY = item.y;
        } else {
          // Image is taller - fit to width
          drawWidth = itemSize;
          drawHeight = itemSize / imgRatio;
          offsetX = item.x;
          offsetY = item.y - (drawHeight - itemSize) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        ctx.restore();
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'fundament-visionboard.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);

    } catch (err) {
      console.error('Export failed:', err);
      alert('Export fehlgeschlagen. Stelle sicher, dass alle Bilder geladen sind.');
    }
  }, [items, backgroundImage]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setDragState(prev => ({ ...prev, itemId: null }));
    }
  };

  return (
    <div className="min-h-screen text-white overflow-hidden flex flex-col relative selection:bg-violet-300">
      
      <header className="absolute top-0 left-0 w-full z-40 px-8 py-6 flex justify-between items-start pointer-events-none exclude-from-export">
        <div className="pointer-events-auto bg-[#2E1065]/90 px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
          <h1 className="text-3xl font-serif italic text-white tracking-tight drop-shadow-sm">Fundament Studio</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200 mt-1 ml-1 font-medium">Visionboard Atelier</p>
        </div>
        
        <div className="flex gap-3 pointer-events-auto">
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all px-4 py-2 rounded-full shadow-lg border ${
              showGrid 
              ? 'bg-violet-500 text-white border-violet-400' 
              : 'bg-[#2E1065]/90 text-violet-200 border-white/10 hover:text-white'
            }`}
          >
            <Grid3x3 size={12} /> {showGrid ? 'Grid On' : 'Grid Off'}
          </button>

          {backgroundImage && (
            <button 
              onClick={() => setBackgroundImage(null)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-200 hover:text-white transition-colors bg-[#2E1065]/90 px-4 py-2 rounded-full shadow-lg border border-white/10"
            >
              <RotateCcw size={12} /> Reset BG
            </button>
          )}
        </div>
      </header>

      <div 
        ref={containerRef}
        data-export-container
        onClick={handleBackgroundClick}
        className="flex-1 relative overflow-hidden touch-none isolate" 
      >
        <div data-background-layer className="absolute inset-0 pointer-events-none z-0">
          {backgroundImage ? (
            <img 
              src={backgroundImage} 
              alt="Background" 
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div 
              className="w-full h-full"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #E9D5FF 0%, #C4B5FD 100%)'
              }}
            />
          )}
        </div>

        {showGrid && !backgroundImage && (
          <div className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-[1]" 
            style={{ 
              backgroundImage: 'radial-gradient(#7c3aed 2px, transparent 2px)', 
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`, 
              opacity: 0.3 
            }}>
          </div>
        )}
        
        {!backgroundImage && !showGrid && (
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }}></div>
        )}

        {items.length === 0 && !backgroundImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center">
              <p className="font-serif text-4xl italic text-[#2E1065] mb-2 drop-shadow-sm">Leeres Vision Board</p>
              <p className="font-sans text-sm tracking-widest uppercase text-[#4C1D95] font-medium">Lade ein Bild hoch, um zu beginnen</p>
            </div>
          </div>
        )}

        {items.map(item => (
          <CanvasItem
            key={item.id}
            item={item}
            isActive={dragState.itemId === item.id}
            onPointerDown={handlePointerDown}
            onResizeStart={handleResizeStart}
            onResizeDiscrete={handleDiscreteResize}
            onRemove={removeItem}
            onBringToFront={bringToFront}
            onSetBackground={handleSetBackground}
          />
        ))}
      </div>

      <div className="absolute bottom-20 sm:bottom-16 md:bottom-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full max-w-md pointer-events-none exclude-from-export">
        <div className="bg-[#1e1b4b]/95 px-8 py-4 rounded-full shadow-2xl shadow-[#2E1065]/20 border border-white/10 flex items-center gap-8 pointer-events-auto">
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center gap-1 text-violet-200 hover:text-white transition-colors w-12"
          >
            <div className="p-2 rounded-full group-hover:bg-white/10 transition-colors">
              <Upload size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-medium tracking-wide uppercase opacity-0 group-hover:opacity-100 absolute -bottom-9 transition-opacity whitespace-nowrap bg-[#0f0a24] text-white px-2 py-1 rounded shadow-lg">Upload</span>
          </button>
          
          <div className="w-px h-8 bg-white/20"></div>

          <button 
            onClick={handleExport}
            className="group relative flex flex-col items-center justify-center gap-1 text-violet-200 hover:text-white transition-colors w-12"
          >
            <div className="p-2 rounded-full group-hover:bg-white/10 transition-colors">
              <Download size={24} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-medium tracking-wide uppercase opacity-0 group-hover:opacity-100 absolute -bottom-9 transition-opacity whitespace-nowrap bg-[#0f0a24] text-white px-2 py-1 rounded shadow-lg">Export</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
          />

        </div>
      </div>
    </div>
  );
};

export default App;