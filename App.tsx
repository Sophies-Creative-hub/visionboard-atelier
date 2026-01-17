import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Grid3x3, ArrowUp, X, Maximize2 } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);
const getRandomRotation = () => Math.random() * 6 - 3;
const GRID_SIZE = 40;

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

const DEFAULT_BACKGROUND = 'radial-gradient(circle at 50% 50%, #FFF7D3 0%, #FFE0B2 100%)';

// Helper um Bilder für den Canvas Export zu laden
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // crossOrigin nur für externe URLs, nicht für data: URLs
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error('Bild konnte nicht geladen werden:', src.substring(0, 50));
      reject(e);
    };
    img.src = src;
  });
};

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
  const imgRef = useRef<HTMLImageElement>(null);
  const [height, setHeight] = useState(200);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalHeight > 0) {
      const aspectRatio = imgRef.current.naturalHeight / imgRef.current.naturalWidth;
      setHeight(item.width * aspectRatio);
    }
  }, [item.width]);

  const handleImageLoad = () => {
    if (imgRef.current) {
      const aspectRatio = imgRef.current.naturalHeight / imgRef.current.naturalWidth;
      setHeight(item.width * aspectRatio);
    }
  };

  return (
    <div
      className="absolute cursor-move select-none group touch-none"
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height,
        zIndex: item.zIndex,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onPointerDown(e, item.id);
        onBringToFront(item.id);
      }}
    >
      <div className="w-full h-full bg-white p-3 rounded-sm shadow-2xl">
        <img
          ref={imgRef}
          src={item.content}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
          onLoad={handleImageLoad}
        />
      </div>
      
      {isActive && (
        <>
          <div className="absolute inset-0 border-2 border-[#CE7200] rounded-sm pointer-events-none" />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            className="absolute -top-3 -right-3 w-8 h-8 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg active:scale-95 transition-transform z-10"
          >
            <X size={16} className="sm:w-3.5 sm:h-3.5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetBackground(item.content);
            }}
            className="absolute -top-3 -left-3 w-8 h-8 sm:w-6 sm:h-6 bg-[#CE7200] text-white rounded-full flex items-center justify-center hover:bg-[#804100] shadow-lg active:scale-95 transition-transform z-10"
            title="Als Hintergrund setzen"
          >
            <Maximize2 size={16} className="sm:w-3.5 sm:h-3.5" />
          </button>
          
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart(e, item.id);
            }}
            className="absolute -bottom-3 -right-3 w-8 h-8 sm:w-6 sm:h-6 bg-[#CE7200] text-white rounded-full flex items-center justify-center cursor-nwse-resize hover:bg-[#804100] shadow-lg active:scale-95 transition-transform z-10 touch-none"
          >
            <div className="w-2.5 h-2.5 sm:w-2 sm:h-2 border-r-2 border-b-2 border-white" />
          </div>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>(DEFAULT_BACKGROUND);
  const [backgroundHistory, setBackgroundHistory] = useState<string[]>([]);

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

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Background CSS für Editor ---
  const getBackgroundStyle = () => {
    if (backgroundImage.startsWith('radial-gradient') || backgroundImage.startsWith('linear-gradient')) {
      return { background: backgroundImage };
    }
    return { 
      backgroundImage: `url('${backgroundImage}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  };

  // --- Drag & Drop Handler ---
  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
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

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.isDragging || !dragState.itemId) return;
    e.preventDefault();
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    setItems(prev => prev.map(item => {
      if (item.id !== dragState.itemId) return item;
      if (dragState.mode === 'move') {
        let x = dragState.originalX + dx;
        let y = dragState.originalY + dy;
        if (showGrid) {
          x = Math.round(x / GRID_SIZE) * GRID_SIZE;
          y = Math.round(y / GRID_SIZE) * GRID_SIZE;
        }
        return { ...item, x, y };
      }
      return { ...item, width: Math.max(50, dragState.originalWidth + dx) };
    }));
  }, [dragState, showGrid]);

  useEffect(() => {
    if (!dragState.isDragging) return;
    const handleUp = () => setDragState(d => ({ ...d, isDragging: false }));
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState.isDragging, handlePointerMove]);

  const addItem = (content: string) => {
    const randomOffset = () => Math.random() * 40 - 20;
    setItems(prev => [...prev, {
      id: generateId(),
      type: 'image',
      content,
      x: 200 + randomOffset(),
      y: 200 + randomOffset(),
      width: 250,
      zIndex: prev.length + 10,
      rotation: showGrid ? 0 : getRandomRotation(),
    }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) addItem(event.target.result as string);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // --- DER NEUE, STABILE EXPORT ---
  const handleExport = async () => {
    if (!containerRef.current) return;

    try {
        console.log('Export gestartet...');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            console.error('Canvas Context konnte nicht erstellt werden');
            return;
        }

        const { clientWidth, clientHeight } = containerRef.current;
        canvas.width = clientWidth * 2;
        canvas.height = clientHeight * 2;
        ctx.scale(2, 2);

        // 2. Hintergrund zeichnen
        if (backgroundImage.startsWith('radial-gradient')) {
            const w = clientWidth;
            const h = clientHeight;
            const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h));
            gradient.addColorStop(0, '#FFF7D3');
            gradient.addColorStop(1, '#FFE0B2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        } else {
            try {
                const bgImg = await loadImage(backgroundImage);
                const ratio = Math.max(clientWidth / bgImg.width, clientHeight / bgImg.height);
                const centerShift_x = (clientWidth - bgImg.width * ratio) / 2;
                const centerShift_y = (clientHeight - bgImg.height * ratio) / 2;
                ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, centerShift_x, centerShift_y, bgImg.width * ratio, bgImg.height * ratio);
            } catch (e) {
                console.warn("Hintergrund konnte nicht geladen werden", e);
                ctx.fillStyle = '#FFF7D3';
                ctx.fillRect(0, 0, clientWidth, clientHeight);
            }
        }

        // 3. Grid zeichnen (falls aktiv)
        if (showGrid) {
            ctx.strokeStyle = 'rgba(206, 114, 0, 0.25)';
            ctx.lineWidth = 1;
            for (let x = 0; x < clientWidth; x += GRID_SIZE) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, clientHeight); ctx.stroke();
            }
            for (let y = 0; y < clientHeight; y += GRID_SIZE) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(clientWidth, y); ctx.stroke();
            }
        }

        // 4. Items sortieren und zeichnen
        const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);
        const frameWidth = 12; // Rahmenbreite
        
        for (let i = 0; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            try {
                const img = await loadImage(item.content);
                ctx.save();
                
                const centerX = item.x + item.width / 2;
                const height = item.width * (img.height / img.width);
                const centerY = item.y + height / 2;
                
                ctx.translate(centerX, centerY);
                ctx.rotate((item.rotation * Math.PI) / 180);
                
                // Weißer Rahmen mit Schatten
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 10;
                ctx.fillRect(-item.width / 2, -height / 2, item.width, height);
                
                // Schatten zurücksetzen
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Bild zeichnen
                ctx.drawImage(
                  img, 
                  -item.width / 2 + frameWidth, 
                  -height / 2 + frameWidth, 
                  item.width - frameWidth * 2, 
                  height - frameWidth * 2
                );
                
                ctx.restore();
            } catch (err) {
                console.error(`Bildfehler beim Export (Item ${i+1}):`, err);
            }
        }

        // 6. Download auslösen
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const formattedDate = day + month + year + '-' + hours + minutes;
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `fundament-studio-${formattedDate}.png`;
        link.href = dataUrl;
        link.click();
        
    } catch (err) {
        console.error('Export fehlgeschlagen:', err);
        alert('Export fehlgeschlagen. Bitte öffne die Browser-Konsole für Details.');
    }
  };

  const setBackground = (content: string) => {
    setBackgroundHistory(prev => [...prev, backgroundImage]);
    setBackgroundImage(content);
  };
  
  const resetBackground = () => { 
    setBackgroundHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setBackgroundImage(last);
      return prev.slice(0, -1);
    });
  };

  const isDefaultBg = backgroundImage === DEFAULT_BACKGROUND;

  return (
    <div className="h-screen flex flex-col relative selection:bg-[#FFC682] text-[#1F1400] overflow-hidden bg-white">
{/*       
      <header className="fixed top-0 left-1/2 -translate-x-1/2 z-40 px-4 sm:px-8 py-4 sm:py-6 pointer-events-none">
        <div className="pointer-events-auto bg-[#804100]/5 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-[#804100]/10 flex flex-col items-center">
            <h1 className="text-lg sm:text-2xl font-mono font-bold text-[#804100]">Fundament Studio</h1>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.25em] text-[#CE7200]">Visionboard Atelier</p>
        </div>
      </header> */}


    <header className="fixed top-0 left-1/2 -translate-x-1/2 z-40 px-4 sm:px-8 py-4 sm:py-6 pointer-events-none exclude-from-export">
      <a 
        href="https://fundament-studio.de" 
        target="_blank" 
        rel="noopener noreferrer"
        className="pointer-events-auto bg-[#804100]/10 backdrop-blur-md px-5 sm:px-8 py-3 sm:py-4 rounded-xl border border-[#CE7200]/20 flex flex-col items-center hover:bg-[#804100]/15 transition-colors shadow-lg"
      >
        <h1 className="text-xl sm:text-3xl font-bold text-[#804100]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Fundament Studio</h1>
        <p className="text-[9px] sm:text-xs uppercase tracking-[0.25em] text-[#CE7200] mt-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Visionboard Atelier</p>
      </a>
    </header>
      <div ref={containerRef} className="flex-1 relative overflow-hidden touch-none">
        <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
            style={getBackgroundStyle()}
        >
            {isDefaultBg && (
            <div className="text-center px-4">
                <h2 className="text-2xl sm:text-4xl font-mono font-bold text-[#804100]/80 mb-2">Vision Board</h2>
                <p className="text-sm sm:text-2l uppercase tracking-[0.25em] text-[#CE7200]">Beginne mit dem Upload...</p>
            </div>
            )}
        </div>

        {showGrid && (
            <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: 'radial-gradient(#CE7200 2px, transparent 2px)',
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                opacity: 0.25,
            }}
            />
        )}

        {items.map(item => (
            <CanvasItem
            key={item.id}
            item={item}
            isActive={dragState.itemId === item.id}
            onPointerDown={handlePointerDown}
            onResizeStart={handleResizeStart}
            onResizeDiscrete={(id, delta) =>
                setItems(prev => prev.map(i => (i.id === id ? { ...i, width: i.width + delta } : i)))
            }
            onRemove={id => setItems(prev => prev.filter(i => i.id !== id))}
            onBringToFront={id => {
                const maxZ = Math.max(...items.map(i => i.zIndex));
                setItems(prev => prev.map(i => (i.id === id ? { ...i, zIndex: maxZ + 1 } : i)));
            }}
            onSetBackground={setBackground}
            />
        ))}

        <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-4 sm:pb-8 pointer-events-none">
            <div className="bg-[#804100]/90 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-4 rounded-full shadow-2xl border border-[#FDF9F5]/10 flex items-center gap-3 sm:gap-6 pointer-events-auto">
            <button onClick={() => fileInputRef.current?.click()} className="group relative flex flex-col items-center justify-center gap-1 text-[#FFC682] hover:text-[#FDF9F5] w-10 sm:w-12 active:scale-95 transition-transform">
                <Upload size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button onClick={handleExport} className="group relative flex flex-col items-center justify-center gap-1 text-[#FFC682] hover:text-[#FDF9F5] w-10 sm:w-12 active:scale-95 transition-transform">
                <Download size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button onClick={() => setShowGrid(!showGrid)} className={`group relative flex flex-col items-center justify-center gap-1 w-10 sm:w-12 rounded-full transition-all active:scale-95 ${showGrid ? 'bg-[#CE7200]/70 text-[#FDF9F5]' : 'bg-[#FFF7D3]/60 text-[#804100]'}`}>
                <Grid3x3 size={18} className="sm:w-5 sm:h-5" />
            </button>
            <button onClick={resetBackground} disabled={backgroundHistory.length === 0} className={`group relative flex flex-col items-center justify-center gap-1 w-10 sm:w-12 rounded-full transition-all active:scale-95 ${backgroundHistory.length === 0 ? 'text-[#FFC682]/50 cursor-not-allowed' : 'text-[#FFC682] hover:text-[#FDF9F5]'}`}>
                <ArrowUp size={18} className="sm:w-5 sm:h-5 rotate-180" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;