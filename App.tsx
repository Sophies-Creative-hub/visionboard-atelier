import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, Layout, RotateCcw } from 'lucide-react';
import { MoodboardItem, DragState } from './types.ts';
import { CanvasItem } from './components/CanvasItem.tsx';
import { toPng } from 'html-to-image';

// Initial state helpers
const generateId = () => Math.random().toString(36).substr(2, 9);
const getRandomRotation = () => Math.random() * 6 - 3; // -3 to 3 degrees for subtle organic feel

const App: React.FC = () => {
  // --- State ---
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
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

  // --- Interaction Logic ---

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return; // Only left click

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

  const handleResizeStart = useCallback((e: React.MouseEvent, id: string) => {
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.itemId) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    setItems(prev => prev.map(item => {
      if (item.id === dragState.itemId) {
        if (dragState.mode === 'move') {
          return {
            ...item,
            x: dragState.originalX + deltaX,
            y: dragState.originalY + deltaY,
          };
        } else if (dragState.mode === 'resize') {
          // Simple width resize based on horizontal drag
          const newWidth = Math.max(50, dragState.originalWidth + deltaX);
          return {
            ...item,
            width: newWidth,
          };
        }
      }
      return item;
    }));
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(prev => ({ 
        ...prev, 
        isDragging: false, 
        itemId: null 
      }));
    }
  }, [dragState]);

  // Global event listeners for drag/resize
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // --- Actions ---

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
      reader.readAsDataURL(file as Blob);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addItem = (content: string) => {
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    // Center initially with some randomness
    const startX = (containerWidth / 2) - 125 + (Math.random() * 60 - 30);
    const startY = (containerHeight / 2) - 125 + (Math.random() * 60 - 30);

    const newItem: MoodboardItem = {
      id: generateId(),
      type: 'image',
      content,
      x: startX,
      y: startY,
      width: 250, 
      zIndex: items.length + 1,
      rotation: getRandomRotation(),
    };

    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const bringToFront = (id: string) => {
    setItems(prev => {
      const maxZ = Math.max(...prev.map(i => i.zIndex), 0);
      return prev.map(item => 
        item.id === id ? { ...item, zIndex: maxZ + 1 } : item
      );
    });
  };

  const handleSetBackground = (content: string) => {
    setBackgroundImage(content);
  };

  const handleExport = useCallback(async () => {
    if (containerRef.current === null) {
      return;
    }

    try {
      const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'latelier-moodboard.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('Could not export image. Please try again.');
    }
  }, [containerRef]);

  return (
    <div className="min-h-screen text-white overflow-hidden flex flex-col relative selection:bg-violet-300">
      
      {/* Header / Brand */}
      <header className="absolute top-0 left-0 w-full z-40 px-8 py-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto bg-[#2E1065]/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
          <h1 className="text-3xl font-serif italic text-white tracking-tight drop-shadow-sm">Fundament Studio</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-violet-200 mt-1 ml-1 font-medium">Visionboard Atelier</p>
        </div>
        
        {/* Background Controls */}
        {backgroundImage && (
          <button 
            onClick={() => setBackgroundImage(null)}
            className="pointer-events-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-200 hover:text-white transition-colors bg-[#2E1065]/40 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/10"
          >
            <RotateCcw size={12} /> Reset Background
          </button>
        )}
      </header>

      {/* Main Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{
          // Use CSS gradient as fallback if no image
          background: backgroundImage 
            ? `url(${backgroundImage}) center/cover no-repeat` 
            : 'radial-gradient(circle at 50% 50%, #E9D5FF 0%, #C4B5FD 100%)', // Lavender Gradient
        }}
      >
        {/* Subtle texture overlay for grain/noise (optional, simplified to CSS only for now) */}
        {!backgroundImage && (
             <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }}></div>
        )}

        {/* Empty State */}
        {items.length === 0 && !backgroundImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {/* Used dark violet text for better readability against light lavender background */}
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
            onMouseDown={handleMouseDown}
            onResizeStart={handleResizeStart}
            onRemove={removeItem}
            onBringToFront={bringToFront}
            onSetBackground={handleSetBackground}
          />
        ))}
      </div>

      {/* Floating Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full max-w-md pointer-events-none">
        
        {/* Toolbar Container - Dark Glass */}
        <div className="bg-[#1e1b4b]/60 backdrop-blur-xl px-8 py-4 rounded-full shadow-2xl shadow-[#2E1065]/20 border border-white/10 flex items-center gap-8 pointer-events-auto">
          
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