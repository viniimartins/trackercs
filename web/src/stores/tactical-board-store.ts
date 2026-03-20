import { create } from 'zustand';

export type DrawTool = 'pen' | 'arrow' | 'text' | 'eraser';
export type DrawColor = '#3b82f6' | '#eab308' | '#ef4444' | '#22c55e';

export interface DrawPoint {
  x: number;
  y: number;
}

export interface Drawing {
  id: string;
  tool: DrawTool;
  color: DrawColor;
  points: DrawPoint[];
  text?: string;
}

interface TacticalBoardState {
  drawings: Drawing[];
  activeTool: DrawTool;
  activeColor: DrawColor;
  isActive: boolean;
  setTool: (tool: DrawTool) => void;
  setColor: (color: DrawColor) => void;
  addDrawing: (drawing: Drawing) => void;
  clearAll: () => void;
  toggleActive: () => void;
}

export const useTacticalBoardStore = create<TacticalBoardState>((set) => ({
  drawings: [],
  activeTool: 'pen',
  activeColor: '#3b82f6',
  isActive: false,
  setTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ activeColor: color }),
  addDrawing: (drawing) =>
    set((s) => ({ drawings: [...s.drawings, drawing] })),
  clearAll: () => set({ drawings: [] }),
  toggleActive: () => set((s) => ({ isActive: !s.isActive })),
}));
