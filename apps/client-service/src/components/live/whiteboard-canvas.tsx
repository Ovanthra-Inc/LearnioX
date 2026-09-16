'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Eraser,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';

interface WhiteboardCanvasProps {
  isPresenter: boolean;
  onSendStroke?: (stroke: any, page: number) => void;
  incomingStroke?: any;
}

const COLORS = ['#FFFFFF', '#10B981', '#38BDF8', '#F43F5E', '#FBBF24', '#A855F7'];

export function WhiteboardCanvas({
  isPresenter,
  onSendStroke,
  incomingStroke,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'rect' | 'circle' | 'line' | 'eraser'>('pen');
  const [color, setColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(3);
  const [page, setPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  // Setup Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      }
    }
  }, []);

  // Ingest incoming remote stroke
  useEffect(() => {
    if (!incomingStroke || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { type, x1, y1, x2, y2, strokeColor, width } = incomingStroke;
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'line') {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (type === 'rect') {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (type === 'circle') {
      ctx.beginPath();
      const radius = Math.hypot(x2 - x1, y2 - y1);
      ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }, [incomingStroke]);

  // Drawing Handlers
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPresenter || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvasRef.current.getContext('2d');
    if (ctx && (tool === 'pen' || tool === 'highlighter' || tool === 'eraser')) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isPresenter || !canvasRef.current || !startPos) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = lineWidth * 5;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = lineWidth * 3;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineTo(x, y);
      ctx.stroke();
      onSendStroke?.(
        {
          type: 'line',
          x1: startPos.x,
          y1: startPos.y,
          x2: x,
          y2: y,
          strokeColor: color,
          width: lineWidth,
        },
        page
      );
      setStartPos({ x, y });
    }
    ctx.restore();
  };

  const stopDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !startPos) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    if (tool === 'rect') {
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      onSendStroke?.(
        {
          type: 'rect',
          x1: startPos.x,
          y1: startPos.y,
          x2: x,
          y2: y,
          strokeColor: color,
          width: lineWidth,
        },
        page
      );
    } else if (tool === 'circle') {
      ctx.beginPath();
      const radius = Math.hypot(x - startPos.x, y - startPos.y);
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      onSendStroke?.(
        {
          type: 'circle',
          x1: startPos.x,
          y1: startPos.y,
          x2: x,
          y2: y,
          strokeColor: color,
          width: lineWidth,
        },
        page
      );
    }
    ctx.restore();

    setIsDrawing(false);
    setStartPos(null);

    // Save snapshot in history
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !isPresenter) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden select-none">
      {/* Top Floating Whiteboard Toolbar */}
      {isPresenter && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-md">
          {/* Tools */}
          <button
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-sm ${tool === 'pen' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
            title="Pencil"
          >
            <Pen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('highlighter')}
            className={`p-1.5 rounded-sm ${tool === 'highlighter' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
            title="Highlighter"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-1.5 rounded-sm ${tool === 'rect' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
            title="Rectangle"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded-sm ${tool === 'circle' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
            title="Circle"
          >
            <Circle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-sm ${tool === 'eraser' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
            title="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                  color === c ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={clearCanvas}
            className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
            title="Clear Board"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 relative w-full h-full">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          className={`w-full h-full block ${isPresenter ? 'cursor-crosshair' : 'cursor-default'}`}
        />
      </div>

      {/* Bottom Page Navigation */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 px-2.5 py-1 bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="disabled:opacity-30 hover:text-white"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span>Page {page} / 5</span>
        <button
          onClick={() => setPage(Math.min(5, page + 1))}
          disabled={page >= 5}
          className="disabled:opacity-30 hover:text-white"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
