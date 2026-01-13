export interface Position {
  x: number;
  y: number;
}

export interface MoodboardItem {
  id: string;
  type: 'image' | 'text';
  content: string; // URL for image, string for text
  x: number;
  y: number;
  width: number;
  zIndex: number;
  rotation: number;
}

export interface DragState {
  isDragging: boolean;
  mode: 'move' | 'resize';
  itemId: string | null;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
  originalWidth: number;
}
