"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
  mirrorMode: MirrorMode;
  isStamp?: boolean;
  stampType?: StampType;
  stampX?: number;
  stampY?: number;
}

type MirrorMode = "horizontal" | "vertical" | "radial4" | "radial8";
type StampType = "star" | "heart" | "circle" | "square" | "triangle" | "diamond";
type Tool = "brush" | "stamp";

const COLORS = [
  "#FF6B6B", // Red
  "#FF9800", // Orange
  "#FFEB3B", // Yellow
  "#8BC34A", // Light Green
  "#4CAF50", // Green
  "#00BCD4", // Cyan
  "#2196F3", // Blue
  "#9C27B0", // Purple
  "#E91E63", // Pink
  "#795548", // Brown
  "#607D8B", // Gray
  "#FFFFFF", // White
];

const STAMP_TYPES: { type: StampType; emoji: string }[] = [
  { type: "star", emoji: "⭐" },
  { type: "heart", emoji: "❤️" },
  { type: "circle", emoji: "🔵" },
  { type: "square", emoji: "🟧" },
  { type: "triangle", emoji: "🔺" },
  { type: "diamond", emoji: "💎" },
];

export default function MirrorDrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(8);
  const [mirrorMode, setMirrorMode] = useState<MirrorMode>("horizontal");
  const [rainbowMode, setRainbowMode] = useState(false);
  const [rainbowHue, setRainbowHue] = useState(0);
  const [tool, setTool] = useState<Tool>("brush");
  const [currentStamp, setCurrentStamp] = useState<StampType>("star");

  // Get rainbow color based on hue
  const getRainbowColor = useCallback((hue: number) => {
    return `hsl(${hue % 360}, 100%, 50%)`;
  }, []);

  // Mirror a point based on mode
  const mirrorPoints = useCallback((point: Point, canvasWidth: number, canvasHeight: number): Point[] => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const points: Point[] = [point];

    switch (mirrorMode) {
      case "horizontal":
        // Mirror across vertical center line
        points.push({ x: canvasWidth - point.x, y: point.y });
        break;
      case "vertical":
        // Mirror across horizontal center line
        points.push({ x: point.x, y: canvasHeight - point.y });
        break;
      case "radial4":
        // 4-way symmetry (both axes + diagonals)
        points.push({ x: canvasWidth - point.x, y: point.y }); // horizontal
        points.push({ x: point.x, y: canvasHeight - point.y }); // vertical
        points.push({ x: canvasWidth - point.x, y: canvasHeight - point.y }); // diagonal
        break;
      case "radial8":
        // 8-way symmetry (rotational)
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        points.push({ x: centerX - dx, y: centerY + dy }); // horizontal
        points.push({ x: centerX + dy, y: centerY - dx }); // 90° rotation
        points.push({ x: centerX - dy, y: centerY + dx }); // 270° rotation
        points.push({ x: centerX - dx, y: centerY - dy }); // 180° rotation
        points.push({ x: centerX + dy, y: centerY + dx }); // diagonal
        points.push({ x: centerX - dy, y: centerY - dx }); // other diagonal
        points.push({ x: centerX + dx, y: centerY - dy }); // mirror of first
        break;
    }

    return points;
  }, [mirrorMode]);

  // Draw stamp shape
  const drawStamp = useCallback((ctx: CanvasRenderingContext2D, type: StampType, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;

    switch (type) {
      case "star":
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const r = i === 0 ? size : size;
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case "heart":
        ctx.beginPath();
        const topY = y - size * 0.3;
        ctx.moveTo(x, y + size * 0.7);
        ctx.bezierCurveTo(x - size, y, x - size, topY, x, topY + size * 0.2);
        ctx.bezierCurveTo(x + size, topY, x + size, y, x, y + size * 0.7);
        ctx.fill();
        ctx.stroke();
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case "square":
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
        ctx.strokeRect(x - size, y - size, size * 2, size * 2);
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x - size, y + size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(x, y - size * 1.2);
        ctx.lineTo(x + size * 0.8, y);
        ctx.lineTo(x, y + size * 1.2);
        ctx.lineTo(x - size * 0.8, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
  }, []);

  // Draw mirrored stamps
  const drawMirroredStamps = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, type: StampType, size: number, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mirroredPoints = mirrorPoints({ x, y }, canvas.width, canvas.height);
    mirroredPoints.forEach(p => {
      drawStamp(ctx, type, p.x, p.y, size, color);
    });
  }, [mirrorPoints, drawStamp]);

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center guides based on mirror mode
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    if (mirrorMode === "horizontal" || mirrorMode === "radial4" || mirrorMode === "radial8") {
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
    }
    if (mirrorMode === "vertical" || mirrorMode === "radial4" || mirrorMode === "radial8") {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw all completed strokes
    strokes.forEach(stroke => {
      if (stroke.isStamp && stroke.stampType && stroke.stampX !== undefined && stroke.stampY !== undefined) {
        drawMirroredStamps(ctx, stroke.stampX, stroke.stampY, stroke.stampType, stroke.size, stroke.color);
      } else if (stroke.points.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = stroke.size;

        const allPoints: Point[][] = [];
        stroke.points.forEach(point => {
          allPoints.push(mirrorPoints(point, canvas.width, canvas.height));
        });

        // Draw each mirrored path
        for (let mirrorIndex = 0; mirrorIndex < allPoints[0].length; mirrorIndex++) {
          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          ctx.moveTo(allPoints[0][mirrorIndex].x, allPoints[0][mirrorIndex].y);
          
          for (let i = 1; i < allPoints.length; i++) {
            ctx.lineTo(allPoints[i][mirrorIndex].x, allPoints[i][mirrorIndex].y);
          }
          ctx.stroke();
        }
      }
    });

    // Draw current stroke
    if (currentStroke.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize;

      const allPoints: Point[][] = [];
      currentStroke.forEach(point => {
        allPoints.push(mirrorPoints(point, canvas.width, canvas.height));
      });

      for (let mirrorIndex = 0; mirrorIndex < allPoints[0].length; mirrorIndex++) {
        ctx.beginPath();
        ctx.strokeStyle = currentColor;
        ctx.moveTo(allPoints[0][mirrorIndex].x, allPoints[0][mirrorIndex].y);
        
        for (let i = 1; i < allPoints.length; i++) {
          ctx.lineTo(allPoints[i][mirrorIndex].x, allPoints[i][mirrorIndex].y);
        }
        ctx.stroke();
      }
    }
  }, [strokes, currentStroke, currentColor, brushSize, mirrorMode, mirrorPoints, drawMirroredStamps]);

  // Handle drawing
  const handleDrawStart = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (tool === "stamp") {
      // Add stamp stroke
      const stampColor = rainbowMode ? getRainbowColor(rainbowHue) : currentColor;
      const newStroke: Stroke = {
        points: [],
        color: stampColor,
        size: brushSize,
        mirrorMode,
        isStamp: true,
        stampType: currentStamp,
        stampX: x,
        stampY: y,
      };
      setStrokes(prev => [...prev, newStroke]);
      if (rainbowMode) setRainbowHue(prev => (prev + 30) % 360);
    } else {
      setIsDrawing(true);
      setCurrentStroke([{ x, y }]);
    }
  }, [tool, currentStamp, currentColor, brushSize, mirrorMode, rainbowMode, rainbowHue, getRainbowColor]);

  const handleDrawMove = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Update rainbow hue while drawing
    if (rainbowMode) {
      setRainbowHue(prev => (prev + 2) % 360);
      setCurrentColor(getRainbowColor(rainbowHue));
    }

    setCurrentStroke(prev => [...prev, { x, y }]);
  }, [isDrawing, rainbowMode, rainbowHue, getRainbowColor]);

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    const newStroke: Stroke = {
      points: currentStroke,
      color: currentColor,
      size: brushSize,
      mirrorMode,
    };

    setStrokes(prev => [...prev, newStroke]);
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, currentColor, brushSize, mirrorMode]);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    setStrokes(prev => prev.slice(0, -1));
  }, []);

  // Clear canvas
  const handleClear = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
  }, []);

  // Save as PNG
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas for saving (without guides)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw background
    const gradient = tempCtx.createLinearGradient(0, 0, tempCanvas.width, tempCanvas.height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.isStamp && stroke.stampType && stroke.stampX !== undefined && stroke.stampY !== undefined) {
        drawMirroredStamps(tempCtx, stroke.stampX, stroke.stampY, stroke.stampType, stroke.size, stroke.color);
      } else if (stroke.points.length > 1) {
        tempCtx.lineCap = "round";
        tempCtx.lineJoin = "round";
        tempCtx.lineWidth = stroke.size;

        const allPoints: Point[][] = [];
        stroke.points.forEach(point => {
          allPoints.push(mirrorPoints(point, tempCanvas.width, tempCanvas.height));
        });

        for (let mirrorIndex = 0; mirrorIndex < allPoints[0].length; mirrorIndex++) {
          tempCtx.beginPath();
          tempCtx.strokeStyle = stroke.color;
          tempCtx.moveTo(allPoints[0][mirrorIndex].x, allPoints[0][mirrorIndex].y);
          
          for (let i = 1; i < allPoints.length; i++) {
            tempCtx.lineTo(allPoints[i][mirrorIndex].x, allPoints[i][mirrorIndex].y);
          }
          tempCtx.stroke();
        }
      }
    });

    // Download
    const link = document.createElement("a");
    link.download = "mirror-drawing.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [strokes, mirrorPoints, drawMirroredStamps]);

  // Render loop
  useEffect(() => {
    render();
  }, [render]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 flex flex-col items-center">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-black text-white mb-2">🪞 Mirror Draw 🪞</h1>
        <p className="text-gray-400">Draw symmetrical art with magic mirrors!</p>
      </header>

      {/* Canvas */}
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={500}
          className="rounded-xl border-4 border-[#2a2a4a] cursor-crosshair bg-[#1a1a2e]"
          onMouseDown={(e) => handleDrawStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleDrawMove(e.clientX, e.clientY)}
          onMouseUp={handleDrawEnd}
          onMouseLeave={handleDrawEnd}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleDrawStart(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleDrawMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handleDrawEnd}
        />
      </div>

      {/* Tool Selection */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={() => setTool("brush")}
          className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
            tool === "brush" 
              ? "bg-[#4ECDC4] text-white scale-105" 
              : "bg-[#2a2a4a] text-white hover:bg-[#3a3a5a]"
          }`}
        >
          🖌️ Brush
        </button>
        <button
          onClick={() => setTool("stamp")}
          className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
            tool === "stamp" 
              ? "bg-[#FF6B6B] text-white scale-105" 
              : "bg-[#2a2a4a] text-white hover:bg-[#3a3a5a]"
          }`}
        >
          🎯 Stamp
        </button>
      </div>

      {/* Stamp Types */}
      {tool === "stamp" && (
        <div className="mb-4 flex gap-2 bg-[#16213e] p-3 rounded-xl">
          {STAMP_TYPES.map(({ type, emoji }) => (
            <button
              key={type}
              onClick={() => setCurrentStamp(type)}
              className={`w-12 h-12 rounded-lg text-2xl transition-all ${
                currentStamp === type 
                  ? "bg-[#FF6B6B] scale-110" 
                  : "bg-[#2a2a4a] hover:bg-[#3a3a5a]"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Mirror Mode */}
      <div className="mb-4 flex gap-2 flex-wrap justify-center">
        {[
          { mode: "horizontal" as MirrorMode, label: "↔️ Horizontal", desc: "Left & Right" },
          { mode: "vertical" as MirrorMode, label: "↕️ Vertical", desc: "Top & Bottom" },
          { mode: "radial4" as MirrorMode, label: "✚ 4-Way", desc: "Cross" },
          { mode: "radial8" as MirrorMode, label: "✴️ 8-Way", desc: "Snowflake" },
        ].map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setMirrorMode(mode)}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              mirrorMode === mode 
                ? "bg-[#9C27B0] text-white scale-105" 
                : "bg-[#2a2a4a] text-white hover:bg-[#3a3a5a]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Color Palette */}
      <div className="mb-4 flex gap-2 flex-wrap justify-center bg-[#16213e] p-3 rounded-xl">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              setCurrentColor(color);
              setRainbowMode(false);
            }}
            className={`w-10 h-10 rounded-lg transition-all border-2 ${
              currentColor === color && !rainbowMode
                ? "border-white scale-125 shadow-lg"
                : "border-transparent hover:scale-110"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
        {/* Rainbow Mode */}
        <button
          onClick={() => setRainbowMode(!rainbowMode)}
          className={`w-10 h-10 rounded-lg transition-all border-2 ${
            rainbowMode
              ? "border-white scale-125 shadow-lg"
              : "border-transparent hover:scale-110"
          }`}
          style={{
            background: rainbowMode 
              ? getRainbowColor(rainbowHue)
              : "linear-gradient(45deg, red, orange, yellow, green, blue, purple)",
          }}
        >
          🌈
        </button>
      </div>

      {/* Brush Size */}
      <div className="mb-4 flex items-center gap-4 bg-[#16213e] px-6 py-3 rounded-xl">
        <span className="text-white font-bold">Brush Size:</span>
        <input
          type="range"
          min="2"
          max="40"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-40 accent-[#4ECDC4]"
        />
        <div 
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          style={{ 
            boxShadow: `0 0 ${brushSize}px ${currentColor}` 
          }}
        >
          <div 
            className="rounded-full"
            style={{ 
              width: brushSize, 
              height: brushSize, 
              backgroundColor: rainbowMode ? getRainbowColor(rainbowHue) : currentColor 
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className="px-6 py-3 bg-[#FF9800] hover:bg-[#F57C00] disabled:bg-gray-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
        >
          ↩️ Undo
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-3 bg-[#E91E63] hover:bg-[#C2185B] text-white font-bold rounded-xl transition-all"
        >
          🗑️ Clear
        </button>
        <button
          onClick={handleSave}
          disabled={strokes.length === 0}
          className="px-6 py-3 bg-[#4CAF50] hover:bg-[#388E3C] disabled:bg-gray-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
        >
          💾 Save
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-gray-400 text-sm max-w-md">
        <p>Draw on the canvas and watch your art mirror itself!</p>
        <p className="mt-1">Try different mirror modes for cool effects ✨</p>
      </div>
    </main>
  );
}
