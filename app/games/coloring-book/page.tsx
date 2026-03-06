"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type GamePhase = "menu" | "coloring";

interface ColoredRegion {
  pathId: string;
  color: string;
}

// 16 color palette for kids
const COLOR_PALETTE = [
  "#FF6B6B", // Red
  "#FF9F43", // Orange
  "#FECA57", // Yellow
  "#48DBFB", // Light Blue
  "#0ABDE3", // Cyan
  "#54A0FF", // Blue
  "#5F27CD", // Purple
  "#A55EEA", // Lavender
  "#FF6B81", // Pink
  "#FF9FF3", // Light Pink
  "#1DD1A1", // Teal
  "#10AC84", // Green
  "#00D2D3", // Turquoise
  "#8B4513", // Brown
  "#F5F5F5", // White
  "#2C3E50", // Dark Gray
];

// SVG Picture definitions with regions (paths)
const PICTURES = [
  {
    id: "butterfly",
    name: "Butterfly",
    emoji: "🦋",
    viewBox: "0 0 200 200",
    regions: [
      { id: "wing1", d: "M100 80 Q50 40 30 80 Q20 120 60 140 Q80 150 100 130 Z", name: "Left Wing" },
      { id: "wing2", d: "M100 80 Q150 40 170 80 Q180 120 140 140 Q120 150 100 130 Z", name: "Right Wing" },
      { id: "wing3", d: "M100 130 Q60 150 50 170 Q60 190 90 180 Q100 170 100 150 Z", name: "Left Lower Wing" },
      { id: "wing4", d: "M100 130 Q140 150 150 170 Q140 190 110 180 Q100 170 100 150 Z", name: "Right Lower Wing" },
      { id: "body", d: "M95 60 L95 160 Q100 170 105 160 L105 60 Q100 50 95 60 Z", name: "Body" },
      { id: "head", d: "M90 55 Q100 35 110 55 Q100 65 90 55 Z", name: "Head" },
      { id: "spot1", d: "M50 90 Q45 100 55 105 Q65 100 60 90 Q55 85 50 90 Z", name: "Spot 1" },
      { id: "spot2", d: "M145 90 Q140 100 150 105 Q160 100 155 90 Q150 85 145 90 Z", name: "Spot 2" },
      { id: "spot3", d: "M70 155 Q65 165 75 170 Q85 165 80 155 Q75 150 70 155 Z", name: "Spot 3" },
      { id: "spot4", d: "M125 155 Q120 165 130 170 Q140 165 135 155 Q130 150 125 155 Z", name: "Spot 4" },
    ],
    strokes: [
      "M95 50 L85 30 M105 50 L115 30", // Antennae
    ],
  },
  {
    id: "cat",
    name: "Cat",
    emoji: "🐱",
    viewBox: "0 0 200 200",
    regions: [
      { id: "head", d: "M50 80 Q50 40 100 40 Q150 40 150 80 Q150 130 100 130 Q50 130 50 80 Z", name: "Head" },
      { id: "ear1", d: "M50 80 L30 40 L70 60 Z", name: "Left Ear" },
      { id: "ear2", d: "M150 80 L170 40 L130 60 Z", name: "Right Ear" },
      { id: "ear1inner", d: "M52 72 L38 50 L62 62 Z", name: "Left Ear Inner" },
      { id: "ear2inner", d: "M148 72 L162 50 L138 62 Z", name: "Right Ear Inner" },
      { id: "nose", d: "M100 90 L92 100 L108 100 Z", name: "Nose" },
      { id: "body", d: "M60 130 Q40 140 40 170 Q40 190 80 190 L120 190 Q160 190 160 170 Q160 140 140 130 Q120 120 100 130 Q80 120 60 130 Z", name: "Body" },
      { id: "tail", d: "M140 160 Q170 150 180 120 Q185 100 175 90", name: "Tail" },
    ],
    strokes: [
      "M100 100 L100 115 M100 110 L85 115 M100 110 L115 115", // Mouth
      "M75 85 L65 85 M125 85 L135 85", // Whiskers
      "M75 90 L60 90 M125 90 L140 90",
      "M75 95 L65 95 M125 95 L135 95",
    ],
    points: [
      { cx: 75, cy: 75, r: 10 }, // Left eye
      { cx: 125, cy: 75, r: 10 }, // Right eye
    ],
  },
  {
    id: "fish",
    name: "Fish",
    emoji: "🐟",
    viewBox: "0 0 200 200",
    regions: [
      { id: "body", d: "M40 100 Q40 50 100 50 Q160 50 160 100 Q160 150 100 150 Q40 150 40 100 Z", name: "Body" },
      { id: "tail", d: "M160 100 L190 60 L190 140 Z", name: "Tail" },
      { id: "fin1", d: "M100 50 Q100 20 80 30 Q90 50 100 50 Z", name: "Top Fin" },
      { id: "fin2", d: "M100 150 Q100 180 80 170 Q90 150 100 150 Z", name: "Bottom Fin" },
      { id: "stripe1", d: "M70 60 L70 140 Q80 145 80 100 Q80 55 70 60 Z", name: "Stripe 1" },
      { id: "stripe2", d: "M110 55 L110 145 Q120 150 120 100 Q120 50 110 55 Z", name: "Stripe 2" },
      { id: "scales", d: "M50 80 Q60 70 70 80 Q60 90 50 80 M80 90 Q90 80 100 90 Q90 100 80 90 M110 85 Q120 75 130 85 Q120 95 110 85", name: "Scales" },
    ],
    points: [
      { cx: 65, cy: 90, r: 12 }, // Eye
    ],
  },
  {
    id: "flower",
    name: "Flower",
    emoji: "🌸",
    viewBox: "0 0 200 200",
    regions: [
      { id: "petal1", d: "M100 40 Q130 20 140 50 Q150 80 120 80 Q100 80 100 60 Z", name: "Petal 1" },
      { id: "petal2", d: "M140 60 Q170 70 160 100 Q150 130 120 110 Q110 100 120 80 Z", name: "Petal 2" },
      { id: "petal3", d: "M130 120 Q140 160 110 160 Q80 160 90 130 Q95 110 110 115 Z", name: "Petal 3" },
      { id: "petal4", d: "M80 130 Q50 150 50 120 Q50 90 80 100 Q100 110 95 120 Z", name: "Petal 4" },
      { id: "petal5", d: "M70 90 Q40 80 50 50 Q60 30 90 50 Q100 60 95 80 Z", name: "Petal 5" },
      { id: "center", d: "M100 70 Q85 80 90 100 Q100 115 115 100 Q120 80 100 70 Z", name: "Center" },
      { id: "stem", d: "M95 110 L95 180 L105 180 L105 110 Z", name: "Stem" },
      { id: "leaf1", d: "M95 140 Q60 130 50 150 Q60 170 95 155 Z", name: "Leaf 1" },
      { id: "leaf2", d: "M105 160 Q140 150 150 170 Q140 190 105 175 Z", name: "Leaf 2" },
    ],
  },
  {
    id: "house",
    name: "House",
    emoji: "🏠",
    viewBox: "0 0 200 200",
    regions: [
      { id: "roof", d: "M30 90 L100 30 L170 90 L30 90 Z", name: "Roof" },
      { id: "body", d: "M40 90 L40 180 L160 180 L160 90 Z", name: "House Body" },
      { id: "door", d: "M85 120 L85 180 L115 180 L115 120 Q100 105 85 120 Z", name: "Door" },
      { id: "window1", d: "M50 105 L50 140 L75 140 L75 105 Z", name: "Window 1" },
      { id: "window2", d: "M125 105 L125 140 L150 140 L150 105 Z", name: "Window 2" },
      { id: "chimney", d: "M130 30 L130 60 L150 60 L150 45 Z", name: "Chimney" },
      { id: "grass", d: "M0 180 Q50 170 100 180 Q150 170 200 180 L200 200 L0 200 Z", name: "Grass" },
    ],
    strokes: [
      "M50 105 L75 105 M50 122.5 L75 122.5 M50 140 L75 140 M62.5 105 L62.5 140", // Window 1 grid
      "M125 105 L150 105 M125 122.5 L150 122.5 M125 140 L150 140 M137.5 105 L137.5 140", // Window 2 grid
    ],
    points: [
      { cx: 108, cy: 150, r: 4 }, // Door handle
    ],
  },
  {
    id: "sun",
    name: "Sun",
    emoji: "☀️",
    viewBox: "0 0 200 200",
    regions: [
      { id: "center", d: "M100 50 Q60 50 50 100 Q50 150 100 150 Q150 150 150 100 Q150 50 100 50 Z", name: "Sun Center" },
      { id: "ray1", d: "M100 20 L95 45 L105 45 Z", name: "Ray 1" },
      { id: "ray2", d: "M140 35 L120 55 L130 60 Z", name: "Ray 2" },
      { id: "ray3", d: "M165 70 L140 80 L145 90 Z", name: "Ray 3" },
      { id: "ray4", d: "M180 100 L155 95 L155 105 Z", name: "Ray 4" },
      { id: "ray5", d: "M165 130 L145 110 L140 120 Z", name: "Ray 5" },
      { id: "ray6", d: "M140 165 L130 140 L120 145 Z", name: "Ray 6" },
      { id: "ray7", d: "M100 180 L105 155 L95 155 Z", name: "Ray 7" },
      { id: "ray8", d: "M60 165 L80 145 L70 140 Z", name: "Ray 8" },
      { id: "ray9", d: "M35 130 L60 120 L55 110 Z", name: "Ray 9" },
      { id: "ray10", d: "M20 100 L45 105 L45 95 Z", name: "Ray 10" },
      { id: "ray11", d: "M35 70 L60 90 L55 80 Z", name: "Ray 11" },
      { id: "ray12", d: "M60 35 L70 60 L80 55 Z", name: "Ray 12" },
    ],
    strokes: [
      "M80 85 Q75 90 80 95", // Left eye smile
      "M120 85 Q125 90 120 95", // Right eye smile
    ],
    points: [
      { cx: 80, cy: 85, r: 5 }, // Left eye
      { cx: 120, cy: 85, r: 5 }, // Right eye
    ],
  },
  {
    id: "heart",
    name: "Heart",
    emoji: "❤️",
    viewBox: "0 0 200 200",
    regions: [
      { id: "left", d: "M100 60 Q100 30 70 30 Q30 30 30 80 Q30 130 100 170 Q100 100 100 60 Z", name: "Left Side" },
      { id: "right", d: "M100 60 Q100 30 130 30 Q170 30 170 80 Q170 130 100 170 Q100 100 100 60 Z", name: "Right Side" },
      { id: "shine", d: "M55 60 Q50 50 60 45 Q70 50 65 60 Q60 65 55 60 Z", name: "Shine" },
    ],
  },
  {
    id: "tree",
    name: "Tree",
    emoji: "🌳",
    viewBox: "0 0 200 200",
    regions: [
      { id: "trunk", d: "M85 140 L85 190 L115 190 L115 140 Z", name: "Trunk" },
      { id: "foliage1", d: "M100 20 Q50 40 50 80 Q50 100 80 100 Q100 100 100 70 Q100 40 100 20 Z", name: "Foliage 1" },
      { id: "foliage2", d: "M100 20 Q150 40 150 80 Q150 100 120 100 Q100 100 100 70 Q100 40 100 20 Z", name: "Foliage 2" },
      { id: "foliage3", d: "M40 90 Q20 100 30 130 Q50 150 80 130 Q100 110 80 90 Q60 80 40 90 Z", name: "Foliage 3" },
      { id: "foliage4", d: "M160 90 Q180 100 170 130 Q150 150 120 130 Q100 110 120 90 Q140 80 160 90 Z", name: "Foliage 4" },
      { id: "foliage5", d: "M60 70 Q30 80 40 110 Q60 130 90 110 Q100 100 80 80 Q70 70 60 70 Z", name: "Foliage 5" },
      { id: "foliage6", d: "M140 70 Q170 80 160 110 Q140 130 110 110 Q100 100 120 80 Q130 70 140 70 Z", name: "Foliage 6" },
    ],
  },
];

export default function ColoringBookPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [currentPicture, setCurrentPicture] = useState(0);
  const [coloredRegions, setColoredRegions] = useState<ColoredRegion[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [history, setHistory] = useState<ColoredRegion[][]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Play sound effect
  const playSound = useCallback((type: "tap" | "undo" | "clear" | "save") => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      switch (type) {
        case "tap":
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
          break;
        case "undo":
          oscillator.frequency.setValueAtTime(500, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
          break;
        case "clear":
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
          break;
        case "save":
          oscillator.frequency.setValueAtTime(523, ctx.currentTime);
          oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
          break;
      }
      
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }, []);

  // Handle region click
  const handleRegionClick = useCallback((regionId: string) => {
    playSound("tap");
    
    // Save current state for undo
    setHistory(prev => [...prev, [...coloredRegions]]);
    
    // Update or add color
    setColoredRegions(prev => {
      const existing = prev.findIndex(r => r.pathId === regionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { pathId: regionId, color: selectedColor };
        return updated;
      }
      return [...prev, { pathId: regionId, color: selectedColor }];
    });
  }, [coloredRegions, selectedColor, playSound]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      playSound("undo");
      const previousState = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setColoredRegions(previousState);
    }
  }, [history, playSound]);

  // Clear all colors
  const handleClear = useCallback(() => {
    if (coloredRegions.length > 0) {
      playSound("clear");
      setHistory(prev => [...prev, [...coloredRegions]]);
      setColoredRegions([]);
    }
  }, [coloredRegions, playSound]);

  // Save picture
  const handleSave = useCallback(() => {
    playSound("save");
    
    // Create a canvas to render the SVG
    const svg = svgRef.current;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 800, 800);
      
      // Download
      const link = document.createElement("a");
      link.download = `coloring-book-${PICTURES[currentPicture].name.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [currentPicture, playSound]);

  // Select picture
  const selectPicture = useCallback((index: number) => {
    setCurrentPicture(index);
    setColoredRegions([]);
    setHistory([]);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setPhase("coloring");
  }, []);

  // Get color for region
  const getRegionColor = useCallback((regionId: string): string => {
    const colored = coloredRegions.find(r => r.pathId === regionId);
    return colored?.color || "#FFFFFF";
  }, [coloredRegions]);

  // Handle touch/mouse events for panning
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(3, Math.max(0.5, prev + delta)));
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  const picture = PICTURES[currentPicture];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#E8F5E9] to-[#E3F2FD] flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {phase === "coloring" && (
            <button
              onClick={() => setPhase("menu")}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all text-xl"
              title="Back to Menu"
            >
              ←
            </button>
          )}
          <h1 className="text-xl md:text-2xl font-black text-[#2C3E50]">
            {phase === "menu" ? "📚 Coloring Book" : `${picture.emoji} ${picture.name}`}
          </h1>
        </div>
        
        {phase === "coloring" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden sm:block">
              Shift+Drag to pan • Scroll to zoom
            </span>
          </div>
        )}
      </header>

      {/* Menu */}
      {phase === "menu" && (
        <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center">
          <p className="text-lg text-gray-600 mb-6 text-center">
            Pick a picture and color it your way! 🎨
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl">
            {PICTURES.map((pic, index) => (
              <button
                key={pic.id}
                onClick={() => selectPicture(index)}
                className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2 border-4 border-transparent hover:border-[#4ECDC4]"
              >
                <div className="text-5xl">{pic.emoji}</div>
                <span className="font-bold text-gray-700">{pic.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coloring Area */}
      {phase === "coloring" && (
        <div className="flex-1 flex flex-col">
          {/* Canvas Area */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden relative bg-white/50"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            >
              <svg
                ref={svgRef}
                viewBox={picture.viewBox}
                className="w-80 h-80 md:w-96 md:h-96 drop-shadow-lg"
                style={{ cursor: isDragging ? "grabbing" : "pointer" }}
              >
                {/* Background */}
                <rect x="0" y="0" width="200" height="200" fill="#FFFFFF" rx="10" />
                
                {/* Regions */}
                {picture.regions.map((region) => (
                  <path
                    key={region.id}
                    d={region.d}
                    fill={getRegionColor(region.id)}
                    stroke="#2C3E50"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="cursor-pointer hover:brightness-95 transition-all"
                    onClick={(e) => {
                      if (!isDragging) {
                        e.stopPropagation();
                        handleRegionClick(region.id);
                      }
                    }}
                  />
                ))}
                
                {/* Additional strokes (lines that aren't fillable) */}
                {picture.strokes?.map((stroke, i) => (
                  <path
                    key={`stroke-${i}`}
                    d={stroke}
                    fill="none"
                    stroke="#2C3E50"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                
                {/* Points (eyes, etc) */}
                {picture.points?.map((point, i) => (
                  <circle
                    key={`point-${i}`}
                    cx={point.cx}
                    cy={point.cy}
                    r={point.r}
                    fill="#2C3E50"
                  />
                ))}
              </svg>
            </div>
            
            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-xl font-bold hover:bg-gray-100 transition-all"
              >
                +
              </button>
              <button
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-xl font-bold hover:bg-gray-100 transition-all"
              >
                −
              </button>
              <button
                onClick={resetZoom}
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition-all"
                title="Reset Zoom"
              >
                ⟲
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-3 md:p-4">
            {/* Color Palette */}
            <div className="flex justify-center gap-2 mb-3 flex-wrap">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-xl transition-all border-3 ${
                    selectedColor === color
                      ? "scale-110 shadow-lg ring-4 ring-[#4ECDC4] ring-offset-2"
                      : "hover:scale-105 shadow border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-2 md:gap-3">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  history.length === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-500 hover:bg-gray-600 text-white active:scale-95"
                }`}
              >
                ↩️ <span className="hidden sm:inline">Undo</span>
              </button>
              
              <button
                onClick={handleClear}
                disabled={coloredRegions.length === 0}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  coloredRegions.length === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#FF6B6B] hover:bg-[#FF5252] text-white active:scale-95"
                }`}
              >
                🗑️ <span className="hidden sm:inline">Clear</span>
              </button>
              
              <button
                onClick={handleSave}
                className="px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white transition-all active:scale-95 flex items-center gap-2"
              >
                💾 <span className="hidden sm:inline">Save</span>
              </button>
              
              <button
                onClick={() => selectPicture(currentPicture)}
                className="px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold bg-[#FF9F43] hover:bg-[#F39C12] text-white transition-all active:scale-95 flex items-center gap-2"
              >
                🔄 <span className="hidden sm:inline">Restart</span>
              </button>
            </div>
            
            {/* Current color indicator */}
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <span className="text-sm text-gray-600">Color:</span>
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-sm font-mono text-gray-500">{selectedColor}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fun message */}
      <div className="text-center py-2 bg-white/50">
        <p className="text-sm text-gray-500">
          ✨ There&apos;s no wrong way to color! Express yourself! 🌈
        </p>
      </div>
    </main>
  );
}
